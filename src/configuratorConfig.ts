/**
 * Single config for configurator timeline and cost.
 * Public page uses `defaultConfig` (not URL). Admin `/config` passes overrides via sessionStorage.
 */

/** One day = $1300 */
export const DEFAULT_RATE_REDUCE = 1300
export const DEFAULT_RATE_INCREASE = 1300

/** Pages per site type (for display): [Promo 1, SaaS 3-5, Corporate 5-9, Enterprise 15-30] */
export const DEFAULT_SITE_PAGES = [1, 4, 7, 22] as const

/** Total work days per site type: Promo 3, SaaS 6, Corporate 15, Enterprise 27 */
export const DEFAULT_TOTAL_DAYS_BY_SITE_TYPE = [3, 6, 15, 27] as const

/** Base days per page (legacy / URL override) */
export const DEFAULT_BASE_DAYS_PER_PAGE = 2.5

/** Reduce cost: days removed */
export const DEFAULT_LIKE_THAT_DAYS = 1   // −1 day Research
export const DEFAULT_UPLOAD_CONTENT_DAYS = 1  // −1 day Wireframes

/** Reduce cost: discounts (percent of total, 90 = −10%) */
export const DEFAULT_SUBSCRIPTION_PCT = 90   // −10%
export const DEFAULT_UPFRONT_PCT = 90        // −10%
export const DEFAULT_LINK_PCT = 95         // −5%

/** Addons: research = +2 days (cost 2×dayRate); copywriting = wireframes/2 × dayRate (calculated on the fly); publication = −$500 */
export const DEFAULT_ADDON_PRICES: Record<string, number> = {
  research: 0,
  copywriting: 0,
  publication: -500,
  installments: 3900,
}

export interface ConfiguratorConfig {
  rateReduce: number
  rateIncrease: number
  sitePages: number[]
  totalDaysBySiteType: number[]
  baseDaysPerPage: number
  likeThatDays: number
  uploadContentDays: number
  subscriptionPct: number
  upfrontPct: number
  linkPct: number
  addonPrices: Record<string, number>
}

export const defaultConfig: ConfiguratorConfig = {
  rateReduce: DEFAULT_RATE_REDUCE,
  rateIncrease: DEFAULT_RATE_INCREASE,
  sitePages: [...DEFAULT_SITE_PAGES],
  totalDaysBySiteType: [...DEFAULT_TOTAL_DAYS_BY_SITE_TYPE],
  baseDaysPerPage: DEFAULT_BASE_DAYS_PER_PAGE,
  likeThatDays: DEFAULT_LIKE_THAT_DAYS,
  uploadContentDays: DEFAULT_UPLOAD_CONTENT_DAYS,
  subscriptionPct: DEFAULT_SUBSCRIPTION_PCT,
  upfrontPct: DEFAULT_UPFRONT_PCT,
  linkPct: DEFAULT_LINK_PCT,
  addonPrices: { ...DEFAULT_ADDON_PRICES },
}

function parseNum(sp: URLSearchParams, key: string, fallback: number): number {
  const v = sp.get(key)
  if (v == null || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

function parsePct(sp: URLSearchParams, key: string, fallback: number): number {
  const n = parseNum(sp, key, fallback)
  return Math.min(100, Math.max(0, n))
}

/** Parse config from URL (only provided params are applied, rest use defaults). */
export function parseConfigFromSearchParams(sp: URLSearchParams): ConfiguratorConfig {
  const addonPrices = { ...defaultConfig.addonPrices }
  ;(['research', 'copywriting', 'publication', 'installments'] as const).forEach((id) => {
    const v = sp.get(`addon_${id}`)
    if (v != null && v !== '') {
      const n = Number(v)
      if (Number.isFinite(n)) addonPrices[id] = Math.round(n)
    }
  })

  const pagesStr = sp.get('pages')
  let sitePages = [...defaultConfig.sitePages]
  if (pagesStr) {
    const parts = pagesStr.split(',').map((s) => parseInt(s.trim(), 10))
    if (parts.length >= 4 && parts.every((n) => Number.isFinite(n) && n >= 0)) {
      sitePages = parts.slice(0, 4)
    }
  }

  const totalDaysStr = sp.get('total_days')
  let totalDaysBySiteType = [...defaultConfig.totalDaysBySiteType]
  if (totalDaysStr) {
    const parts = totalDaysStr.split(',').map((s) => parseInt(s.trim(), 10))
    if (parts.length >= 4 && parts.every((n) => Number.isFinite(n) && n > 0)) {
      totalDaysBySiteType = parts.slice(0, 4)
    }
  }

  return {
    rateReduce: parseNum(sp, 'rate_reduce', defaultConfig.rateReduce),
    rateIncrease: parseNum(sp, 'rate_increase', defaultConfig.rateIncrease),
    sitePages,
    totalDaysBySiteType,
    baseDaysPerPage: parseNum(sp, 'base_days', defaultConfig.baseDaysPerPage),
    likeThatDays: parseNum(sp, 'like_days', defaultConfig.likeThatDays),
    uploadContentDays: parseNum(sp, 'upload_days', defaultConfig.uploadContentDays),
    subscriptionPct: parsePct(sp, 'sub_pct', defaultConfig.subscriptionPct),
    upfrontPct: parsePct(sp, 'upfront_pct', defaultConfig.upfrontPct),
    linkPct: parsePct(sp, 'link_pct', defaultConfig.linkPct),
    addonPrices,
  }
}

/** Build URL params from config (for the config page link). */
export function configToSearchParams(c: ConfiguratorConfig): URLSearchParams {
  const sp = new URLSearchParams()
  sp.set('rate_reduce', String(c.rateReduce))
  sp.set('rate_increase', String(c.rateIncrease))
  sp.set('pages', c.sitePages.join(','))
  sp.set('total_days', c.totalDaysBySiteType.join(','))
  sp.set('base_days', String(c.baseDaysPerPage))
  sp.set('like_days', String(c.likeThatDays))
  sp.set('upload_days', String(c.uploadContentDays))
  sp.set('sub_pct', String(c.subscriptionPct))
  sp.set('upfront_pct', String(c.upfrontPct))
  sp.set('link_pct', String(c.linkPct))
  Object.entries(c.addonPrices).forEach(([id, price]) => sp.set(`addon_${id}`, String(price)))
  return sp
}

export interface ConfiguratorUiPrefs {
  preset: '0' | '1'
  step3Version: 'reduce' | 'increase'
  theme: 'light' | 'dark'
  dayRateOverride?: number
}

/** Default UI for the public homepage (formerly in DEFAULT_HOMEPAGE_QUERY). */
export const DEFAULT_UI_PREFS: ConfiguratorUiPrefs = {
  preset: '1',
  step3Version: 'increase',
  theme: 'dark',
}

const CONFIG_OVERRIDE_SESSION_KEY = 'configurator_config_override'
const CONFIG_UI_SESSION_KEY = 'configurator_ui_prefs'
const CONFIG_INITIAL_STEP_SESSION_KEY = 'configurator_initial_step'

export function saveConfiguratorLaunch(config: ConfiguratorConfig, ui: ConfiguratorUiPrefs): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(CONFIG_OVERRIDE_SESSION_KEY, JSON.stringify(config))
  sessionStorage.setItem(CONFIG_UI_SESSION_KEY, JSON.stringify(ui))
}

export function consumeConfiguratorLaunch(): { config: ConfiguratorConfig; ui: ConfiguratorUiPrefs } | null {
  if (typeof sessionStorage === 'undefined') return null
  const rawConfig = sessionStorage.getItem(CONFIG_OVERRIDE_SESSION_KEY)
  const rawUi = sessionStorage.getItem(CONFIG_UI_SESSION_KEY)
  sessionStorage.removeItem(CONFIG_OVERRIDE_SESSION_KEY)
  sessionStorage.removeItem(CONFIG_UI_SESSION_KEY)
  if (!rawConfig && !rawUi) return null
  try {
    const config = rawConfig
      ? ({ ...defaultConfig, ...JSON.parse(rawConfig) } as ConfiguratorConfig)
      : defaultConfig
    const ui: ConfiguratorUiPrefs = rawUi ? JSON.parse(rawUi) : DEFAULT_UI_PREFS
    return { config, ui }
  } catch {
    return null
  }
}

export function setInitialStepSession(step: number): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(CONFIG_INITIAL_STEP_SESSION_KEY, String(step))
}

export function consumeInitialStepSession(): number | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(CONFIG_INITIAL_STEP_SESSION_KEY)
  sessionStorage.removeItem(CONFIG_INITIAL_STEP_SESSION_KEY)
  if (!raw) return null
  const n = parseInt(raw, 10)
  return n >= 1 && n <= 4 ? n : null
}

function presetToSiteIndex(preset: '0' | '1'): number {
  return preset === '0' ? 0 : 3
}

function presetToAnimation(preset: '0' | '1'): number {
  return preset === '0' ? 1 : 4
}

export function initialSiteTypeIndex(ui: ConfiguratorUiPrefs = DEFAULT_UI_PREFS): number {
  return presetToSiteIndex(ui.preset)
}

export function initialAnimationLevel(ui: ConfiguratorUiPrefs = DEFAULT_UI_PREFS): number {
  return presetToAnimation(ui.preset)
}

/** Read step from URL once (legacy bookmarks), then strip query from the address bar. */
export function readInitialStepFromUrl(): number {
  if (typeof window === 'undefined') return 1
  const n = parseInt(new URLSearchParams(window.location.search).get('step') || '1', 10)
  return n >= 1 && n <= 4 ? n : 1
}
