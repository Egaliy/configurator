/**
 * Single config for configurator timeline and cost.
 * Params can be overridden via URL (?rate_reduce=..., addon_research=..., etc.).
 */

export const DEFAULT_RATE_REDUCE = 1670
export const DEFAULT_RATE_INCREASE = 1375

/** Pages per site type: [Promo, SaaS, Corporate, Enterprise] */
export const DEFAULT_SITE_PAGES = [1, 4, 7, 22] as const

/** Base days per page (stage formula) */
export const DEFAULT_BASE_DAYS_PER_PAGE = 2.5

/** Reduce cost: days removed */
export const DEFAULT_LIKE_THAT_DAYS = 1   // −1 day Research
export const DEFAULT_UPLOAD_CONTENT_DAYS = 1  // −1 day Wireframes

/** Reduce cost: discounts (percent of total, 90 = −10%) */
export const DEFAULT_SUBSCRIPTION_PCT = 90   // −10%
export const DEFAULT_UPFRONT_PCT = 90        // −10%
export const DEFAULT_LINK_PCT = 95         // −5%

/** Addons: price by id */
export const DEFAULT_ADDON_PRICES: Record<string, number> = {
  research: 1300,
  copywriting: 3900,
  secret: 1950,
  installments: 3900,
}

export interface ConfiguratorConfig {
  rateReduce: number
  rateIncrease: number
  sitePages: number[]
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
  ;(['research', 'copywriting', 'secret', 'installments'] as const).forEach((id) => {
    const v = sp.get(`addon_${id}`)
    if (v != null && v !== '') {
      const n = Number(v)
      if (Number.isFinite(n) && n >= 0) addonPrices[id] = Math.round(n)
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

  return {
    rateReduce: parseNum(sp, 'rate_reduce', defaultConfig.rateReduce),
    rateIncrease: parseNum(sp, 'rate_increase', defaultConfig.rateIncrease),
    sitePages,
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
  sp.set('base_days', String(c.baseDaysPerPage))
  sp.set('like_days', String(c.likeThatDays))
  sp.set('upload_days', String(c.uploadContentDays))
  sp.set('sub_pct', String(c.subscriptionPct))
  sp.set('upfront_pct', String(c.upfrontPct))
  sp.set('link_pct', String(c.linkPct))
  Object.entries(c.addonPrices).forEach(([id, price]) => sp.set(`addon_${id}`, String(price)))
  return sp
}

/** Default query string for the main page. When user opens / without params, redirect to this. */
export const DEFAULT_HOMEPAGE_QUERY =
  'step=1&preset=1&v=1&rate_reduce=1670&rate_increase=1375&pages=1,4,7,22&base_days=2.5&like_days=1&upload_days=1&sub_pct=90&upfront_pct=90&link_pct=95&addon_research=1300&addon_copywriting=3900&addon_secret=1950&addon_installments=3900'
