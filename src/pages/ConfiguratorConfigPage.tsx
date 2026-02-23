import { useState } from 'react'
import {
  defaultConfig,
  configToSearchParams,
  DEFAULT_RATE_REDUCE,
  DEFAULT_RATE_INCREASE,
  DEFAULT_SITE_PAGES,
  DEFAULT_BASE_DAYS_PER_PAGE,
  DEFAULT_LIKE_THAT_DAYS,
  DEFAULT_UPLOAD_CONTENT_DAYS,
  DEFAULT_SUBSCRIPTION_PCT,
  DEFAULT_UPFRONT_PCT,
  DEFAULT_LINK_PCT,
  DEFAULT_ADDON_PRICES,
  type ConfiguratorConfig,
} from '../configuratorConfig'

type Preset = '0' | '1'
type Version = '0' | '1'
type Theme = 'light' | 'dark'

const SITE_NAMES = ['Promo (1 page)', 'SaaS (3–5)', 'Corporate (5–9)', 'Enterprise (15–30)']
const ADDON_IDS = ['research', 'copywriting', 'secret', 'installments'] as const
const ADDON_LABELS: Record<string, string> = {
  research: 'Extensive Research',
  copywriting: 'Professional Copywriting',
  secret: 'Keep it secret',
  installments: 'Pay in installments',
}

function NumInput({
  value,
  onChange,
  placeholder,
  min = 0,
  step = 1,
  className = 'w-20',
}: {
  value: string
  onChange: (s: string) => void
  placeholder?: string
  min?: number
  step?: number
  className?: string
}) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white text-sm tracking-tighter placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white ${className}`}
    />
  )
}

export default function ConfiguratorConfigPage() {
  const [preset, setPreset] = useState<Preset>('1')
  const [version, setVersion] = useState<Version>('1')
  const [theme, setTheme] = useState<Theme>('dark')
  const [rateInput, setRateInput] = useState('')

  const [rateReduce, setRateReduce] = useState(String(DEFAULT_RATE_REDUCE))
  const [rateIncrease, setRateIncrease] = useState(String(DEFAULT_RATE_INCREASE))
  const [sitePages, setSitePages] = useState<string[]>(DEFAULT_SITE_PAGES.map(String))
  const [baseDaysPerPage, setBaseDaysPerPage] = useState(String(DEFAULT_BASE_DAYS_PER_PAGE))
  const [likeThatDays, setLikeThatDays] = useState(String(DEFAULT_LIKE_THAT_DAYS))
  const [uploadContentDays, setUploadContentDays] = useState(String(DEFAULT_UPLOAD_CONTENT_DAYS))
  const [subscriptionPct, setSubscriptionPct] = useState(String(DEFAULT_SUBSCRIPTION_PCT))
  const [upfrontPct, setUpfrontPct] = useState(String(DEFAULT_UPFRONT_PCT))
  const [linkPct, setLinkPct] = useState(String(DEFAULT_LINK_PCT))
  const [addonPrices, setAddonPrices] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(DEFAULT_ADDON_PRICES).map(([k, v]) => [k, String(v)]))
  )

  const buildConfig = (): ConfiguratorConfig => ({
    rateReduce: parseNum(rateReduce, defaultConfig.rateReduce),
    rateIncrease: parseNum(rateIncrease, defaultConfig.rateIncrease),
    sitePages: Array.from({ length: 4 }, (_, i) => parseNum(sitePages[i] ?? '', defaultConfig.sitePages[i] ?? 1)),
    baseDaysPerPage: parseNum(baseDaysPerPage, defaultConfig.baseDaysPerPage),
    likeThatDays: parseNum(likeThatDays, defaultConfig.likeThatDays),
    uploadContentDays: parseNum(uploadContentDays, defaultConfig.uploadContentDays),
    subscriptionPct: Math.min(100, Math.max(0, parseNum(subscriptionPct, defaultConfig.subscriptionPct))),
    upfrontPct: Math.min(100, Math.max(0, parseNum(upfrontPct, defaultConfig.upfrontPct))),
    linkPct: Math.min(100, Math.max(0, parseNum(linkPct, defaultConfig.linkPct))),
    addonPrices: Object.fromEntries(
      ADDON_IDS.map((id) => [id, parseNum(addonPrices[id] ?? '', defaultConfig.addonPrices[id] ?? 0)])
    ),
  })

  function parseNum(s: string, fallback: number): number {
    if (s === '') return fallback
    const n = Number(s)
    return Number.isFinite(n) && n >= 0 ? n : fallback
  }

  const configSp = configToSearchParams(buildConfig())
  const search = new URLSearchParams()
  search.set('step', '1')
  search.set('preset', preset)
  if (version === '1') search.set('v', '1')
  if (theme === 'light') search.set('theme', 'light')
  if (rateInput !== '' && !Number.isNaN(Number(rateInput)) && Number(rateInput) > 0) {
    search.set('rate', String(Math.round(Number(rateInput))))
  }
  configSp.forEach((v, k) => search.set(k, v))
  const configuratorUrl = `/?${search.toString()}`

  const defaultRate = version === '1' ? parseNum(rateIncrease, DEFAULT_RATE_INCREASE) : parseNum(rateReduce, DEFAULT_RATE_REDUCE)
  const rateNum = rateInput !== '' && !Number.isNaN(Number(rateInput)) && Number(rateInput) > 0 ? Math.round(Number(rateInput)) : null
  const ratePerHour = rateNum != null ? Math.round(rateNum / 8) : null
  const changeRateBy = (delta: number) => {
    const base = rateNum ?? defaultRate
    setRateInput(String(Math.max(1, base + delta)))
  }

  const setSitePage = (index: number, value: string) => {
    setSitePages((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }
  const setAddonPrice = (id: string, value: string) => {
    setAddonPrices((prev) => ({ ...prev, [id]: value }))
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-normal mb-2 tracking-tighter">
          Configurator format
        </h1>
        <p className="text-sm opacity-60 tracking-tighter mb-10">
          All timeline and cost settings. How much time each option adds or removes, discounts and add-on prices. The link below opens the configurator with this math.
        </p>

        <div className="space-y-10">
          {/* Preset / Theme / Step 3 variant */}
          <div>
            <div className="text-sm font-medium opacity-80 mb-3 tracking-tighter">Preset</div>
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              <button
                type="button"
                onClick={() => setPreset('0')}
                className={`flex-1 py-4 px-4 text-center text-sm tracking-tighter transition-colors ${preset === '0' ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}
              >
                Preselected cheap options
              </button>
              <button
                type="button"
                onClick={() => setPreset('1')}
                className={`flex-1 py-4 px-4 text-center text-sm tracking-tighter transition-colors ${preset === '1' ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}
              >
                Preselected expensive options
              </button>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium opacity-80 mb-3 tracking-tighter">Theme</div>
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex-1 py-4 px-4 text-center text-sm tracking-tighter transition-colors ${theme === 'dark' ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 py-4 px-4 text-center text-sm tracking-tighter transition-colors ${theme === 'light' ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}
              >
                Light
              </button>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium opacity-80 mb-3 tracking-tighter">Step 3 variant</div>
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              <button
                type="button"
                onClick={() => setVersion('0')}
                className={`flex-1 py-4 px-4 text-center text-sm tracking-tighter transition-colors ${version === '0' ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}
              >
                Reduce cost
              </button>
              <button
                type="button"
                onClick={() => setVersion('1')}
                className={`flex-1 py-4 px-4 text-center text-sm tracking-tighter transition-colors ${version === '1' ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}
              >
                Add options
              </button>
            </div>
          </div>

          {/* Rates per day */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-lg font-medium mb-4 tracking-tighter">Rates ($/day)</h2>
            <p className="text-xs opacity-50 mb-3 tracking-tighter">
              Default rate for «Reduce cost» and «Add options». Optionally override with a single manual rate.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm opacity-70 w-32">Reduce cost</span>
                <NumInput value={rateReduce} onChange={setRateReduce} />
                <span className="text-sm opacity-60">$/day</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm opacity-70 w-32">Add options</span>
                <NumInput value={rateIncrease} onChange={setRateIncrease} />
                <span className="text-sm opacity-60">$/day</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm opacity-70 w-32">Override (optional)</span>
                <button type="button" onClick={() => changeRateBy(-50)} className="px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-sm hover:bg-white/10">−50</button>
                <NumInput value={rateInput} onChange={setRateInput} placeholder={`e.g. ${defaultRate}`} className="w-28" />
                <button type="button" onClick={() => changeRateBy(50)} className="px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-sm hover:bg-white/10">+50</button>
                <span className="text-sm opacity-60">$/day</span>
                {ratePerHour != null && <span className="text-sm opacity-50">(≈ ${ratePerHour}/hr)</span>}
              </div>
            </div>
          </div>

          {/* Timeline: formula and pages */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-lg font-medium mb-4 tracking-tighter">Timeline (days)</h2>
            <p className="text-xs opacity-50 mb-3 tracking-tighter">
              Base days per page used in the stage formula. Pages per site type (Goals). Days removed by «Conduct research yourself» and «Upload content yourself».
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm opacity-70 w-48">Base days per page</span>
                <NumInput value={baseDaysPerPage} onChange={setBaseDaysPerPage} step={0.5} />
              </div>
              <div className="text-sm opacity-70 mb-1">Pages per site type</div>
              {SITE_NAMES.map((name, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm opacity-70 w-48">{name}</span>
                  <NumInput value={sitePages[i] ?? ''} onChange={(v) => setSitePage(i, v)} />
                  <span className="text-sm opacity-50">pages → affects Research, Design, Wireframes, Dev, QA</span>
                </div>
              ))}
              <div className="flex items-center gap-3 mt-4">
                <span className="text-sm opacity-70 w-48">Conduct research yourself</span>
                <NumInput value={likeThatDays} onChange={setLikeThatDays} />
                <span className="text-sm opacity-50">days off Research</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm opacity-70 w-48">Upload content yourself</span>
                <NumInput value={uploadContentDays} onChange={setUploadContentDays} />
                <span className="text-sm opacity-50">days off Wireframes</span>
              </div>
            </div>
          </div>

          {/* Reduce cost: discounts */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-lg font-medium mb-4 tracking-tighter">Reduce cost — discounts (%)</h2>
            <p className="text-xs opacity-50 mb-3 tracking-tighter">
              Total is multiplied by this percentage. 90 = −10%, 95 = −5%, 100 = no discount.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm opacity-70 w-40">Subscription</span>
                <NumInput value={subscriptionPct} onChange={setSubscriptionPct} min={0} />
                <span className="text-sm opacity-50">% (currently −{100 - (parseNum(subscriptionPct, 90) || 100)}%)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm opacity-70 w-40">Pay upfront</span>
                <NumInput value={upfrontPct} onChange={setUpfrontPct} min={0} />
                <span className="text-sm opacity-50">%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm opacity-70 w-40">Link to us</span>
                <NumInput value={linkPct} onChange={setLinkPct} min={0} />
                <span className="text-sm opacity-50">%</span>
              </div>
            </div>
          </div>

          {/* Add options — add-on prices */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-lg font-medium mb-4 tracking-tighter">Add options — add-on prices ($)</h2>
            <div className="space-y-3">
              {ADDON_IDS.map((id) => (
                <div key={id} className="flex items-center gap-3">
                  <span className="text-sm opacity-70 w-44">{ADDON_LABELS[id] ?? id}</span>
                  <NumInput value={addonPrices[id] ?? ''} onChange={(v) => setAddonPrice(id, v)} className="w-24" />
                  <span className="text-sm opacity-50">$</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <a
              href={configuratorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 px-6 bg-white text-black text-center font-medium rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors tracking-tighter"
            >
              Open configurator
            </a>
            <p className="text-xs opacity-50 mt-3 tracking-tighter break-all">
              {configuratorUrl}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
