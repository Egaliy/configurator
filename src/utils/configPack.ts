import { defaultConfig, type ConfiguratorConfig, type ConfiguratorUiPrefs } from '../configuratorConfig'

const PACK_VERSION = 1
const PACK_KEY = (import.meta.env.VITE_CONFIG_PACK_SECRET as string | undefined)?.trim() || 'ubernatural-cfg-v1'

export const CONFIG_PACK_PARAM = 'k'

export interface PackedLaunch {
  config: ConfiguratorConfig
  ui: ConfiguratorUiPrefs
  step: number
}

function xorBytes(data: Uint8Array, key: string): Uint8Array {
  const kb = new TextEncoder().encode(key)
  const out = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ kb[i % kb.length]!
  return out
}

function checksum(bytes: Uint8Array): number {
  let c = 0
  for (let i = 0; i < bytes.length; i++) c = (c + bytes[i]!) & 0xff
  return c
}

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(token: string): Uint8Array | null {
  try {
    let s = token.replace(/-/g, '+').replace(/_/g, '/')
    while (s.length % 4) s += '='
    const bin = atob(s)
    return Uint8Array.from(bin, (c) => c.charCodeAt(0))
  } catch {
    return null
  }
}

function sanitizeConfig(raw: ConfiguratorConfig): ConfiguratorConfig {
  const addonPrices: Record<string, number> = {}
  for (const id of ['research', 'copywriting', 'publication', 'installments']) {
    const n = raw.addonPrices[id] ?? defaultConfig.addonPrices[id] ?? 0
    addonPrices[id] = Math.max(-50000, Math.min(50000, Math.round(n)))
  }
  return {
    rateReduce: Math.max(1, Math.min(100000, Math.round(raw.rateReduce))),
    rateIncrease: Math.max(1, Math.min(100000, Math.round(raw.rateIncrease))),
    sitePages: raw.sitePages.map((n) => Math.max(0, Math.min(255, Math.round(n)))),
    totalDaysBySiteType: raw.totalDaysBySiteType.map((n) => Math.max(1, Math.min(255, Math.round(n)))),
    baseDaysPerPage: Math.max(0.5, Math.min(50, raw.baseDaysPerPage)),
    likeThatDays: Math.max(0, Math.min(30, Math.round(raw.likeThatDays))),
    uploadContentDays: Math.max(0, Math.min(30, Math.round(raw.uploadContentDays))),
    subscriptionPct: Math.min(100, Math.max(0, Math.round(raw.subscriptionPct))),
    upfrontPct: Math.min(100, Math.max(0, Math.round(raw.upfrontPct))),
    linkPct: Math.min(100, Math.max(0, Math.round(raw.linkPct))),
    addonPrices,
  }
}

function writeU16(view: DataView, offset: number, n: number) {
  view.setUint16(offset, Math.max(0, Math.min(65535, Math.round(n))), false)
}

function readU16(view: DataView, offset: number) {
  return view.getUint16(offset, false)
}

/** Binary pack → XOR → base64url. Typical length ~70–90 chars. */
export function packConfiguratorLaunch(
  config: ConfiguratorConfig,
  ui: ConfiguratorUiPrefs,
  step = 1
): string {
  const hasRate = ui.dayRateOverride != null && ui.dayRateOverride > 0
  const flags =
    (ui.preset === '1' ? 1 : 0) |
    (ui.step3Version === 'increase' ? 2 : 0) |
    (ui.theme === 'light' ? 4 : 0) |
    (hasRate ? 8 : 0)

  const size = 38 + (hasRate ? 2 : 0)
  const buf = new ArrayBuffer(size)
  const view = new DataView(buf)
  let o = 0
  view.setUint8(o++, PACK_VERSION)
  view.setUint8(o++, Math.min(4, Math.max(1, step)))
  view.setUint8(o++, flags)
  if (hasRate) {
    writeU16(view, o, ui.dayRateOverride!)
    o += 2
  }
  writeU16(view, o, config.rateReduce)
  o += 2
  writeU16(view, o, config.rateIncrease)
  o += 2
  for (let i = 0; i < 4; i++) view.setUint8(o++, config.sitePages[i] ?? 0)
  for (let i = 0; i < 4; i++) view.setUint8(o++, config.totalDaysBySiteType[i] ?? 1)
  view.setUint8(o++, Math.round(config.baseDaysPerPage * 2))
  view.setUint8(o++, config.likeThatDays)
  view.setUint8(o++, config.uploadContentDays)
  view.setUint8(o++, config.subscriptionPct)
  view.setUint8(o++, config.upfrontPct)
  view.setUint8(o++, config.linkPct)
  const addons = ['research', 'copywriting', 'publication', 'installments'] as const
  for (const id of addons) {
    writeU16(view, o, config.addonPrices[id] ?? 0)
    o += 2
  }
  const body = new Uint8Array(buf)
  const cs = checksum(body)
  const withCs = new Uint8Array(body.length + 1)
  withCs.set(body)
  withCs[body.length] = cs
  return base64UrlEncode(xorBytes(withCs, PACK_KEY))
}

export function unpackConfiguratorLaunch(token: string): PackedLaunch | null {
  const raw = base64UrlDecode(token.trim())
  if (!raw || raw.length < 2) return null
  const xored = xorBytes(raw, PACK_KEY)
  const cs = xored[xored.length - 1]!
  const body = xored.subarray(0, xored.length - 1)
  if (checksum(body) !== cs) return null

  const view = new DataView(body.buffer, body.byteOffset, body.byteLength)
  let o = 0
  if (view.getUint8(o++) !== PACK_VERSION) return null
  const step = view.getUint8(o++)
  if (step < 1 || step > 4) return null
  const flags = view.getUint8(o++)
  const hasRate = (flags & 8) !== 0
  let dayRateOverride: number | undefined
  if (hasRate) {
    dayRateOverride = readU16(view, o)
    o += 2
  }
  const rateReduce = readU16(view, o)
  o += 2
  const rateIncrease = readU16(view, o)
  o += 2
  const sitePages: number[] = []
  for (let i = 0; i < 4; i++) sitePages.push(view.getUint8(o++))
  const totalDaysBySiteType: number[] = []
  for (let i = 0; i < 4; i++) totalDaysBySiteType.push(view.getUint8(o++))
  const baseDaysPerPage = view.getUint8(o++) / 2
  const likeThatDays = view.getUint8(o++)
  const uploadContentDays = view.getUint8(o++)
  const subscriptionPct = view.getUint8(o++)
  const upfrontPct = view.getUint8(o++)
  const linkPct = view.getUint8(o++)
  const addonPrices: Record<string, number> = {}
  const addons = ['research', 'copywriting', 'publication', 'installments'] as const
  for (const id of addons) {
    addonPrices[id] = readU16(view, o)
    o += 2
  }

  const ui: ConfiguratorUiPrefs = {
    preset: (flags & 1) ? '1' : '0',
    step3Version: (flags & 2) ? 'increase' : 'reduce',
    theme: (flags & 4) ? 'light' : 'dark',
    dayRateOverride,
  }

  const config = sanitizeConfig({
    rateReduce,
    rateIncrease,
    sitePages,
    totalDaysBySiteType,
    baseDaysPerPage,
    likeThatDays,
    uploadContentDays,
    subscriptionPct,
    upfrontPct,
    linkPct,
    addonPrices,
  })

  return { config, ui, step }
}

export function buildPackedConfiguratorUrl(
  origin: string,
  config: ConfiguratorConfig,
  ui: ConfiguratorUiPrefs,
  step = 1
): string {
  const k = packConfiguratorLaunch(config, ui, step)
  return `${origin.replace(/\/$/, '')}/?${CONFIG_PACK_PARAM}=${k}`
}

/** Legacy plain query keys — ignored on the public page when `k` is absent. */
export const LEGACY_CONFIG_PARAM_KEYS = new Set([
  'rate_reduce',
  'rate_increase',
  'pages',
  'total_days',
  'base_days',
  'like_days',
  'upload_days',
  'sub_pct',
  'upfront_pct',
  'link_pct',
  'preset',
  'v',
  'theme',
  'rate',
  'step',
  'addon_research',
  'addon_copywriting',
  'addon_publication',
  'addon_installments',
])

export function hasLegacyConfigParams(sp: URLSearchParams): boolean {
  for (const key of sp.keys()) {
    if (LEGACY_CONFIG_PARAM_KEYS.has(key) || key.startsWith('addon_')) return true
  }
  return false
}
