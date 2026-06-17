import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import StagesTable from '../components/StagesTable'
import Configurator from '../components/Configurator'
import {
  trackConfiguratorStep,
  trackConfiguratorGoal,
  trackConfiguratorScope,
  trackConfiguratorNavigate,
  trackConfiguratorOption,
  trackConfiguratorAddon,
  trackConfiguratorLead,
} from '../utils/facebookPixel'
import {
  defaultConfig,
  DEFAULT_UI_PREFS,
  consumeConfiguratorLaunch,
  consumeInitialStepSession,
  readInitialStepFromUrl,
  initialSiteTypeIndex,
  initialAnimationLevel,
  DEFAULT_TOTAL_DAYS_BY_SITE_TYPE,
  type ConfiguratorConfig,
  type ConfiguratorUiPrefs,
} from '../configuratorConfig'
import {
  CONFIG_PACK_PARAM,
  unpackConfiguratorLaunch,
  hasLegacyConfigParams,
} from '../utils/configPack'
import {
  getGalleryPreviewSrc,
  getAllGalleryVideoSrcs,
  preloadGalleryVideos,
} from '../configuratorGallery'
import { submitLead, type LeadPayload } from '../utils/submitLead'

interface StageDays {
  research: number
  designConcept: number
  wireframes: number
  highFidelity: number
  dev: number
  qa: number
}

const ANIMATION_LEVELS = [
  { title: 'Basic', subtitle: 'Clean and Elegant', value: 1, icon: 'Basic.svg' },
  { title: 'Advanced', subtitle: 'Premium Motion', value: 2, icon: 'Advanced.svg' },
  { title: 'Cinematic', subtitle: 'Hero-Level', value: 3, icon: 'Cinematic.svg' },
  { title: 'Immersive', subtitle: 'More than a website.', value: 4, icon: 'Immersive.svg' },
] as const

function getAnimationLabel(value: number): string {
  const level = ANIMATION_LEVELS.find((l) => l.value === value)
  return level ? level.title : 'Animation'
}

const SITE_TYPES = [
  { title: 'Promo Site', subtitle: '1 page website', pages: 1, icon: 'Promo.svg' },
  { title: 'SaaS Product Site', subtitle: '3-5 page website', pages: 4, icon: 'SaaS.svg' },
  { title: 'Corporate Site', subtitle: '5-9 page website', pages: 7, icon: 'Corporate.svg' },
  { title: 'Enterprise Site', subtitle: '15-30 page website', pages: 22, icon: 'Enterprise.svg' },
] as const

const GALLERY_VIDEO_SRCS = getAllGalleryVideoSrcs()

function PreviewGallery({
  siteTypeIndex,
  animation,
  fill16x9,
}: {
  siteTypeIndex: number
  animation: number
  fill16x9?: boolean
}) {
  const activeSrc = getGalleryPreviewSrc(siteTypeIndex, animation)
  const site = SITE_TYPES[siteTypeIndex] ?? SITE_TYPES[0]
  const animLabel = getAnimationLabel(animation)
  const videoRefs = useRef<Map<string, HTMLVideoElement[]>>(new Map())

  const registerVideo = useCallback((src: string, el: HTMLVideoElement | null) => {
    if (!el) return
    const list = videoRefs.current.get(src) ?? []
    if (!list.includes(el)) list.push(el)
    videoRefs.current.set(src, list)
  }, [])

  useEffect(() => {
    for (const [src, videos] of videoRefs.current) {
      const isActive = src === activeSrc
      for (const video of videos) {
        if (isActive) {
          video.currentTime = 0
          void video.play().catch(() => {})
        } else {
          video.pause()
        }
      }
    }
  }, [activeSrc])

  return (
    <div
      className={`overflow-hidden bg-white/5 relative ${fill16x9 ? 'w-full h-full' : 'aspect-square rounded-lg border border-white/10'}`}
      role="img"
      aria-label={`${site.title} — ${animLabel}`}
    >
      {GALLERY_VIDEO_SRCS.map((src) => {
        const isActive = src === activeSrc
        return (
          <div
            key={src}
            aria-hidden
            className={`absolute inset-0 transition-opacity duration-300 ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <video
              ref={(el) => registerVideo(src, el)}
              src={src}
              muted
              loop
              playsInline
              preload="auto"
              className="gallery-preview-bg absolute inset-0 w-full h-full object-cover"
            />
            <video
              ref={(el) => registerVideo(src, el)}
              src={src}
              muted
              loop
              playsInline
              preload="auto"
              className="gallery-preview-fg absolute inset-0 w-full h-full object-contain object-center"
            />
          </div>
        )
      })}
    </div>
  )
}

const ADDONS = [
  { id: 'research', price: 0, title: 'Extensive Research', description: '+2 days — we will interview up to 10 stakeholders', badge: true, icon: 'Research.svg' },
  { id: 'copywriting', price: 0, title: 'Professional Copywriting', description: 'We write the texts for your project', badge: false, icon: 'Copywriting.svg' },
  { id: 'publication', price: -500, title: 'Allow publication', description: '$500 off for permission to publish on our site, socials, galleries', badge: false, icon: 'Secret.svg' },
  { id: 'installments', price: 3900, title: 'Pay in installments', description: 'Spread cost over time (10% added to total)', badge: true, icon: 'Installments.svg' },
] as const

const STAGE_KEYS: (keyof StageDays)[] = ['research', 'designConcept', 'wireframes', 'highFidelity', 'dev', 'qa']
const MIN_STAGE_DAYS = 0.25
/** When total days >= this, round stages to whole days instead of 0.25/0.5 */
const WHOLE_DAY_THRESHOLD = 10

/** Base: 1 day research, 1 design, 1 dev = 3 days. Rest (total − 3) distributed by weights. If any stage would be 0, distribute total days equally (step 0.25). When totalDays >= 10, round to whole days. */
function stageDaysFromTotal(totalDays: number): StageDays {
  const toQuarter = (n: number) => Math.round(n * 4) / 4
  const roundToDay = totalDays >= WHOLE_DAY_THRESHOLD
  const roundFn = (n: number) => (roundToDay ? Math.round(n) : Math.round(n * 2) / 2)
  const base = 3
  const rest = Math.max(0, totalDays - base)
  const weights = { research: 0.15, designConcept: 0.2, wireframes: 0.15, highFidelity: 0.25, dev: 0.2, qa: 0.05 }
  let research = roundFn(1 + rest * weights.research)
  let designConcept = roundFn(1 + rest * weights.designConcept)
  let wireframes = roundFn(rest * weights.wireframes)
  let highFidelity = roundFn(rest * weights.highFidelity)
  let dev = roundFn(1 + rest * weights.dev)
  let qa = roundFn(rest * weights.qa)
  const raw = { research, designConcept, wireframes, highFidelity, dev, qa }
  const hasZero = STAGE_KEYS.some((k) => raw[k] <= 0)
  if (hasZero) {
    const perStage = totalDays / 6
    const baseVal = Math.max(MIN_STAGE_DAYS, toQuarter(perStage))
    const vals = STAGE_KEYS.map(() => baseVal)
    vals[3] = Math.max(1, Math.round(vals[3]))  // highFidelity: always whole, min 1
    vals[4] = Math.max(1, Math.round(vals[4]))  // dev: always whole, min 1
    const remaining = totalDays - vals[3] - vals[4]
    const perOther = Math.max(MIN_STAGE_DAYS, toQuarter(remaining / 4))
    vals[0] = perOther
    vals[1] = perOther
    vals[2] = perOther
    vals[5] = Math.max(MIN_STAGE_DAYS, toQuarter(remaining - perOther * 3))
    let sum = vals.reduce((a, b) => a + b, 0)
    if (sum !== totalDays) vals[0] = Math.max(MIN_STAGE_DAYS, toQuarter(vals[0] + (totalDays - sum)))
    return {
      research: vals[0],
      designConcept: vals[1],
      wireframes: vals[2],
      highFidelity: vals[3],
      dev: vals[4],
      qa: vals[5],
    }
  }
  highFidelity = Math.max(1, Math.round(highFidelity))
  dev = Math.max(1, Math.round(dev))
  let sum = research + designConcept + wireframes + highFidelity + dev + qa
  if (sum !== totalDays) {
    research = Math.max(0, roundFn(research + (totalDays - sum)))
  }
  return {
    research: Math.max(0, research),
    designConcept: Math.max(0, designConcept),
    wireframes: Math.max(0, wireframes),
    highFidelity,
    dev,
    qa: Math.max(0, qa),
  }
}

/** Animation: +10% (level 1) to +50% (level 4) on design and dev stages */
function animationPct(level: number): number {
  return 10 + (40 * (Math.max(1, Math.min(4, level)) - 1)) / 3
}

/** With rounding: for table display (High-fidelity and Dev whole, min 1). */
function applyAnimationToStageDays(days: StageDays, animationLevel: number): StageDays {
  const mult = 1 + animationPct(animationLevel) / 100
  const total = Object.values(days).reduce((s, d) => s + d, 0)
  const roundToDay = total >= WHOLE_DAY_THRESHOLD
  const roundFn = (n: number) => (roundToDay ? Math.round(n) : Math.round(n * 4) / 4)
  return {
    research: days.research,
    designConcept: roundFn(days.designConcept * mult),
    wireframes: roundFn(days.wireframes * mult),
    highFidelity: Math.max(1, Math.round(days.highFidelity * mult)),
    dev: Math.max(1, Math.round(days.dev * mult)),
    qa: days.qa,
  }
}

/** No rounding of design/dev: used for cost and delivery so they always change with animation. */
function applyAnimationToStageDaysForCost(days: StageDays, animationLevel: number): StageDays {
  const mult = 1 + animationPct(animationLevel) / 100
  return {
    research: days.research,
    designConcept: days.designConcept * mult,
    wireframes: days.wireframes * mult,
    highFidelity: Math.max(1, days.highFidelity * mult),
    dev: Math.max(1, days.dev * mult),
    qa: days.qa,
  }
}

function readLaunchOnce(): {
  config: ConfiguratorConfig
  ui: ConfiguratorUiPrefs
  step: number
  packToken: string | null
} {
  if (typeof window !== 'undefined') {
    const sp = new URLSearchParams(window.location.search)
    const token = sp.get(CONFIG_PACK_PARAM)
    if (token) {
      const packed = unpackConfiguratorLaunch(token)
      if (packed) {
        return { ...packed, packToken: token }
      }
    }
  }
  const launch = consumeConfiguratorLaunch()
  const ui = launch?.ui ?? DEFAULT_UI_PREFS
  const config = launch?.config ?? defaultConfig
  const fromSession = consumeInitialStepSession()
  const step = fromSession ?? readInitialStepFromUrl()
  return { config, ui, step, packToken: null }
}

/**
 * Public configurator: pricing math is fixed in code (not URL).
 * Step navigation is in React state; address bar stays clean (/).
 */
export default function ConfiguratorPage() {
  const launchRef = useRef(readLaunchOnce())
  const [searchParams, setSearchParams] = useSearchParams()
  const [config] = useState<ConfiguratorConfig>(() => launchRef.current.config)
  const [step3Version] = useState<'reduce' | 'increase'>(() => launchRef.current.ui.step3Version)
  const [theme] = useState<'light' | 'dark'>(() => launchRef.current.ui.theme)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(() => launchRef.current.step as 1 | 2 | 3 | 4)

  const defaultDayRate = step3Version === 'reduce' ? config.rateReduce : config.rateIncrease
  const dayRate =
    launchRef.current.ui.dayRateOverride != null && launchRef.current.ui.dayRateOverride > 0
      ? Math.round(launchRef.current.ui.dayRateOverride)
      : defaultDayRate

  const packToken = launchRef.current.packToken

  const syncUrlParams = (token: string | null) => {
    if (token) {
      const next = new URLSearchParams()
      next.set(CONFIG_PACK_PARAM, token)
      if (searchParams.get(CONFIG_PACK_PARAM) !== token || hasLegacyConfigParams(searchParams)) {
        setSearchParams(next, { replace: true })
      }
      return
    }
    if (searchParams.toString()) {
      setSearchParams({}, { replace: true })
    }
  }

  const goToStep = (n: number) => {
    const toStep = Math.min(4, Math.max(1, n)) as 1 | 2 | 3 | 4
    trackConfiguratorNavigate(toStep > step ? 'next' : 'back', step, toStep)
    setStep(toStep)
    syncUrlParams(packToken)
  }

  useEffect(() => {
    syncUrlParams(packToken)
  }, [searchParams, setSearchParams, packToken])

  useEffect(() => {
    preloadGalleryVideos()
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  useEffect(() => {
    trackConfiguratorStep(step)
  }, [step])

  const [siteTypeIndex, setSiteTypeIndex] = useState(() => initialSiteTypeIndex(launchRef.current.ui))
  const pages = config.sitePages[siteTypeIndex] ?? SITE_TYPES[siteTypeIndex].pages
  const [animation, setAnimation] = useState(() => initialAnimationLevel(launchRef.current.ui))
  const [likeThat, setLikeThat] = useState(false)
  const [uploadContent, setUploadContent] = useState(false)
  const [subscription, setSubscription] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [paymentUpfront, setPaymentUpfront] = useState(false)
  const [linkToUs, setLinkToUs] = useState(false)
  const [showDetailedCalculation, setShowDetailedCalculation] = useState(false)
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(() => new Set(['research', 'copywriting']))

  const getTotalDaysForType = (index: number) => config.totalDaysBySiteType?.[index] ?? DEFAULT_TOTAL_DAYS_BY_SITE_TYPE[index]
  const [originalDays, setOriginalDays] = useState<StageDays>(() => stageDaysFromTotal(DEFAULT_TOTAL_DAYS_BY_SITE_TYPE[siteTypeIndex]))
  const [stageDays, setStageDays] = useState<StageDays>(() => stageDaysFromTotal(DEFAULT_TOTAL_DAYS_BY_SITE_TYPE[siteTypeIndex]))

  const updateDays = (totalDaysForType: number) => {
    const newOriginalDays = stageDaysFromTotal(totalDaysForType)
    setOriginalDays(newOriginalDays)
    const research = likeThat ? Math.max(0, newOriginalDays.research - config.likeThatDays) : newOriginalDays.research
    const wireframes = uploadContent ? Math.max(0, newOriginalDays.wireframes - config.uploadContentDays) : newOriginalDays.wireframes
    setStageDays({ ...newOriginalDays, research, wireframes })
  }

  const handleSiteTypeSelect = (index: number) => {
    const site = SITE_TYPES[index]
    trackConfiguratorGoal(site.title, site.pages)
    setSiteTypeIndex(index)
    updateDays(getTotalDaysForType(index))
  }

  const handleAnimationLevelSelect = (value: number) => {
    trackConfiguratorScope(getAnimationLabel(value), value)
    setAnimation(value)
  }

  const handleLikeThatChange = (checked: boolean) => {
    setLikeThat(checked)
    const currentOriginal = originalDays
    const newResearch = checked ? Math.max(0, currentOriginal.research - config.likeThatDays) : currentOriginal.research
    const newWireframes = uploadContent ? Math.max(0, currentOriginal.wireframes - config.uploadContentDays) : currentOriginal.wireframes
    setStageDays({ ...currentOriginal, research: newResearch, wireframes: newWireframes })
  }

  const handleUploadContentChange = (checked: boolean) => {
    trackConfiguratorOption('upload_content_yourself', checked)
    setUploadContent(checked)
    const currentOriginal = originalDays
    const newWireframes = checked ? Math.max(0, currentOriginal.wireframes - config.uploadContentDays) : currentOriginal.wireframes
    const newResearch = likeThat ? Math.max(0, currentOriginal.research - config.likeThatDays) : currentOriginal.research
    setStageDays({ ...currentOriginal, research: newResearch, wireframes: newWireframes })
  }

  /** Animation applies only from step 2 onward; on step 1 cost/duration ignore animation */
  const effectiveStageDays = useMemo(
    () => (step === 1 ? stageDays : applyAnimationToStageDays(stageDays, animation)),
    [step, stageDays, animation]
  )
  const effectiveOriginalDays = useMemo(
    () => (step === 1 ? originalDays : applyAnimationToStageDays(originalDays, animation)),
    [step, originalDays, animation]
  )
  const effectiveStageDaysForCost = useMemo(
    () => (step === 1 ? stageDays : applyAnimationToStageDaysForCost(stageDays, animation)),
    [step, stageDays, animation]
  )
  const effectiveOriginalDaysForCost = useMemo(
    () => (step === 1 ? originalDays : applyAnimationToStageDaysForCost(originalDays, animation)),
    [step, originalDays, animation]
  )
  const totalDays = Object.values(effectiveStageDaysForCost).reduce((sum, days) => sum + days, 0)
  /** Addons (research, copywriting, etc.) apply only from step 3 onward */
  const copywritingExtraDays = step >= 3 && selectedAddonIds.has('copywriting') ? effectiveOriginalDaysForCost.wireframes / 2 : 0
  const researchExtraDays = step >= 3 && selectedAddonIds.has('research') ? 2 : 0
  const effectiveTotalDays = totalDays + copywritingExtraDays + researchExtraDays
  /** For display: round delivery days up (6.5 → 7) */
  const deliveryDaysDisplay = Math.ceil(effectiveTotalDays)
  const baseTotalDays = Object.values(effectiveOriginalDaysForCost).reduce((sum, days) => sum + days, 0)
  const baseCost = effectiveTotalDays * dayRate
  const currentCost = baseCost
  const discounts: string[] = []
  let totalCost = currentCost
  if (likeThat) discounts.push('Conduct research yourself')
  if (uploadContent) discounts.push('Upload content yourself')
  if (subscription) { totalCost *= config.subscriptionPct / 100; discounts.push(`Subscription −${100 - config.subscriptionPct}%`) }
  if (paymentUpfront) { totalCost *= config.upfrontPct / 100; discounts.push(`Pay upfront −${100 - config.upfrontPct}%`) }
  if (linkToUs) { totalCost *= config.linkPct / 100; discounts.push(`Link to us −${100 - config.linkPct}%`) }
  const addonsTotal = step >= 3
    ? ADDONS.filter((a) => selectedAddonIds.has(a.id)).reduce((sum, a) => {
        if (a.id === 'copywriting') return sum
        return sum + (config.addonPrices[a.id] ?? a.price)
      }, 0)
    : 0
  let summaryTotalCost = totalCost + addonsTotal
  const installmentsSelected = step >= 3 && selectedAddonIds.has('installments')
  if (installmentsSelected && effectiveTotalDays > 5) {
    summaryTotalCost = summaryTotalCost * 1.1
  }
  const hasDiscounts = discounts.length > 0 || totalDays < baseTotalDays

  /** Weeks for payment split (5 work days = 1 week) */
  const workWeeks = Math.max(1, Math.ceil(effectiveTotalDays / 5))
  /** Show "X/week for N weeks (Total)" when installments addon is selected */
  const showPaymentSplit = step >= 3 && selectedAddonIds.has('installments')
  const formatInvestment = (amount: number, useSplit: boolean) => {
    if (useSplit) {
      const perWeek = Math.round(amount / workWeeks)
      return `Investment: $${perWeek.toLocaleString()}/week for ${workWeeks} weeks ($${Math.round(amount).toLocaleString()})`
    }
    return `Investment: $${Math.round(amount).toLocaleString()}`
  }

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev)
      const added = !next.has(id)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      trackConfiguratorAddon(id, added)
      return next
    })
  }

  const STEPS = [
    { num: 1, label: 'Goals' },
    { num: 2, label: 'Scope' },
    { num: 3, label: 'Options' },
    { num: 4, label: 'Book' },
  ]
  const nextStepLabel = STEPS.find((s) => s.num === step + 1)?.label

  const stepIndicator = (
    <div className="mb-8 step-indicator">
      <div className="flex gap-1 mb-4 step-indicator-strip">
        {STEPS.map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => goToStep(s.num)}
            className={`flex-1 h-[2px] rounded-full transition-colors ${
              step >= s.num ? 'bg-white' : 'bg-white/20'
            } hover:bg-white/40`}
            aria-label={`Step ${s.num}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm tracking-tighter">
        {STEPS.map((s, i) => (
          <span key={s.num} className="flex items-center gap-x-2">
            {i > 0 && <span className="text-white/40">—</span>}
            <button
              type="button"
              onClick={() => goToStep(s.num)}
              className={step === s.num ? 'text-white' : 'text-white/40 hover:text-white/70 transition-colors'}
            >
              {s.num}. {s.label}
            </button>
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <div
      data-theme={theme}
      className={`min-h-screen pb-0 w-full configurator-root ${theme === 'light' ? 'configurator-theme-light' : 'bg-black text-white'}`}
    >
      {/* Steps 1–2: left image (gallery), right content */}
      {step <= 2 ? (
        <div key="step1-2" className="grid grid-cols-1 lg:grid-cols-2 w-full min-h-screen lg:h-screen animate-step-in">
          {/* Left column: on mobile first, 300px height; on desktop full height */}
          <div className="flex flex-col h-[300px] lg:h-full w-full min-h-0 flex-shrink-0 lg:flex-shrink bg-black order-1 lg:order-1">
            <div className="flex-1 min-h-0 flex flex-col p-2 lg:p-4">
              <div className="flex-1 min-h-0 relative rounded-lg lg:rounded-xl overflow-hidden bg-white/5 border border-white/10 w-full h-full">
                <PreviewGallery siteTypeIndex={siteTypeIndex} animation={animation} fill16x9 />
              </div>
            </div>
          </div>
          {/* Right column: on mobile order — steps, title, buttons */}
          <div className="flex flex-col min-h-0 flex-1 lg:h-full w-full px-6 lg:px-12 lg:pl-10 py-6 lg:py-12 order-2 lg:order-2 overflow-y-auto">
            <div className="flex flex-col">
              <div className="order-2 lg:order-1 mb-6 lg:mb-8">
                {step === 1 && (
                  <>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal mb-4 heading-large">
                      Website Cost Configurator
                    </h1>
                    <p className="text-base md:text-lg opacity-60 tracking-tighter">
                      Configure your website project parameters and see the estimated cost and timeline
                    </p>
                  </>
                )}
                {step === 2 && (
                  <>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal mb-4 heading-large">
                      Choose animation level
                    </h1>
                    <p className="text-base md:text-lg opacity-60 tracking-tighter">
                      Select the level of animation for your project
                    </p>
                  </>
                )}
              </div>
              <div className="order-1 lg:order-2 mb-6 lg:mb-8">
                {stepIndicator}
              </div>
            </div>
            <div className="space-y-10 order-3">
              {step === 1 && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {SITE_TYPES.map((site, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSiteTypeSelect(index)}
                      className={`option-card text-left px-4 py-4 sm:px-5 sm:py-5 rounded-xl transition-colors ${
                        siteTypeIndex === index
                          ? 'option-card-active bg-white/15 border-2 border-white/50 hover:bg-white/15 hover:border-white/50 cursor-default transition-none outline-none focus:outline-none focus:ring-0'
                          : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <img
                        src={`/imgs/${site.icon}`}
                        alt=""
                        className="w-6 h-6 mb-2 object-contain opacity-90"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                      <div className="text-base sm:text-lg font-medium text-white tracking-tighter">
                        {site.title}
                      </div>
                      <div className="text-xs sm:text-sm opacity-60 tracking-tighter mt-1">
                        {site.subtitle}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {ANIMATION_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => handleAnimationLevelSelect(level.value)}
                      className={`option-card text-left px-4 py-4 sm:px-5 sm:py-5 rounded-xl transition-colors ${
                        animation === level.value
                          ? 'option-card-active bg-white/15 border-2 border-white/50 hover:bg-white/15 hover:border-white/50 cursor-default transition-none outline-none focus:outline-none focus:ring-0'
                          : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <img
                        src={`/imgs/${level.icon}`}
                        alt=""
                        className="w-6 h-6 mb-2 object-contain opacity-90"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                      <div className="text-base sm:text-lg font-medium text-white tracking-tighter">
                        {level.title}
                      </div>
                      <div className="text-xs sm:text-sm opacity-60 tracking-tighter mt-1">
                        {level.subtitle}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Investment, Delivery, Detailed Calculation */}
              <div className="mt-10 pt-8 border-t border-white/10 space-y-2">
                <div className="text-base md:text-lg opacity-60 tracking-tighter font-normal">
                  {formatInvestment(totalCost, false)}
                  {hasDiscounts && paymentUpfront && (
                    <span className="ml-2">({discounts.join(', ')})</span>
                  )}
                </div>
                <div className="text-2xl md:text-3xl font-normal text-white tracking-tighter heading-large">
                  Delivery in: {deliveryDaysDisplay} work days
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetailedCalculation(!showDetailedCalculation)}
                  className="text-sm md:text-base opacity-60 hover:opacity-100 transition-opacity tracking-tighter underline block"
                >
                  {showDetailedCalculation ? 'Hide' : 'Detailed Calculation'}
                </button>
                {showDetailedCalculation && (
                  <div className="pt-4">
                    <StagesTable
                      stageDays={effectiveStageDays}
                      originalDays={effectiveOriginalDays}
                      likeThat={likeThat}
                      uploadContent={uploadContent}
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  {step === 2 && (
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="flex-1 min-w-0 md:flex-initial px-6 py-4 bg-white/10 text-white text-base font-medium rounded-lg hover:bg-white/15 transition-colors duration-200 tracking-tighter"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => goToStep(step === 1 ? 2 : 3)}
                    className="flex-1 min-w-0 md:flex-initial px-8 py-4 bg-white text-black text-base font-medium rounded-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-200 tracking-tighter"
                  >
                    {nextStepLabel ? `Next: ${nextStepLabel}` : 'Next step'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div key="steps3-4" className="grid grid-cols-1 lg:grid-cols-2 w-full min-h-screen lg:h-screen animate-step-in">
          {/* Gallery: on mobile first, 300px; on desktop left full height */}
          <div className="flex flex-col h-[300px] lg:h-full w-full min-h-0 flex-shrink-0 lg:flex-shrink bg-black order-1 lg:order-1">
            <div className="flex-1 min-h-0 flex flex-col p-2 lg:p-4">
              <div className="flex-1 min-h-0 relative rounded-lg lg:rounded-xl overflow-hidden bg-white/5 border border-white/10 w-full h-full">
                <PreviewGallery siteTypeIndex={siteTypeIndex} animation={animation} fill16x9 />
              </div>
            </div>
          </div>
          <div className="flex flex-col min-h-0 flex-1 lg:h-full w-full px-6 lg:px-12 lg:pl-10 py-6 lg:py-12 order-2 lg:order-2 overflow-y-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal mb-4 heading-large">
                {step === 3 && (step3Version === 'increase' ? 'Add options' : 'Reduce cost')}
                {step === 4 && 'Leave a request'}
              </h1>
              <p className="text-base md:text-lg opacity-60 tracking-tighter">
                {step === 3 && (step3Version === 'increase' ? 'Add options to increase the value and scope of your project' : 'Choose options to lower the project cost')}
                {step === 4 && 'Send your request and we will contact you to discuss the project'}
              </p>
            </div>
            {stepIndicator}
            {step === 3 && step3Version === 'reduce' && (
              <div className="space-y-8">
                <Configurator
                  likeThat={likeThat}
                  onLikeThatChange={handleLikeThatChange}
                  uploadContent={uploadContent}
                  onUploadContentChange={handleUploadContentChange}
                  subscription={subscription}
                  onSubscriptionChange={(v) => {
                    trackConfiguratorOption('subscription', v)
                    setSubscription(v)
                  }}
                  subscriptionLoading={subscriptionLoading}
                  onSubscriptionLoadingChange={setSubscriptionLoading}
                  paymentUpfront={paymentUpfront}
                  onPaymentUpfrontChange={(v) => {
                    trackConfiguratorOption('payment_upfront', v)
                    setPaymentUpfront(v)
                  }}
                  linkToUs={linkToUs}
                  onLinkToUsChange={(v) => {
                    trackConfiguratorOption('link_to_us', v)
                    setLinkToUs(v)
                  }}
                />
                {showDetailedCalculation && (
                  <>
                    <StagesTable
                      stageDays={effectiveStageDays}
                      originalDays={effectiveOriginalDays}
                      likeThat={likeThat}
                      uploadContent={uploadContent}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDetailedCalculation(false)}
                      className="text-sm md:text-base opacity-60 hover:opacity-100 transition-opacity tracking-tighter underline mt-4"
                    >
                      Hide
                    </button>
                  </>
                )}
                <div className="pt-8 border-t border-white/10 space-y-2">
                  <div className="text-base md:text-lg opacity-60 tracking-tighter font-normal">
                    {formatInvestment(totalCost, false)}
                    {hasDiscounts && paymentUpfront && (
                      <span className="ml-2">({discounts.join(', ')})</span>
                    )}
                  </div>
                  <div className="text-2xl md:text-3xl font-normal text-white tracking-tighter heading-large">
                    Delivery in: {deliveryDaysDisplay} work days
                  </div>
                  <button type="button" onClick={() => setShowDetailedCalculation(!showDetailedCalculation)} className="text-sm md:text-base opacity-60 hover:opacity-100 transition-opacity tracking-tighter underline block">
                    {showDetailedCalculation ? 'Hide' : 'Detailed Calculation'}
                  </button>
                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    <button type="button" onClick={() => goToStep(2)} className="flex-1 min-w-0 md:flex-initial px-6 py-4 bg-white/10 text-white text-base font-medium rounded-lg hover:bg-white/15 transition-colors duration-200 tracking-tighter">Back</button>
                    <button type="button" onClick={() => goToStep(4)} className="flex-1 min-w-0 md:flex-initial px-8 py-4 bg-white text-black text-base font-medium rounded-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-200 tracking-tighter">{nextStepLabel ? `Next: ${nextStepLabel}` : 'Next step'}</button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && step3Version === 'increase' && (
              <div className="space-y-8">
                <p className="text-base md:text-lg opacity-60 tracking-tighter">
                  Add options to increase the value and scope of your project
                </p>
                <div className="space-y-4 mb-8">
                  {ADDONS.filter((a) => a.id !== 'installments' || effectiveTotalDays > 5).map((addon) => {
                    const isResearchAddon = addon.id === 'research'
                    const researchCost = 2 * dayRate
                    const isCopywritingAddon = addon.id === 'copywriting'
                    const copywritingCost = (originalDays.wireframes / 2) * dayRate
                    const isPublicationAddon = addon.id === 'publication'
                    const price = config.addonPrices[addon.id] ?? addon.price
                    const priceStr = isResearchAddon
                      ? `+$${Math.round(researchCost).toLocaleString()}`
                      : isCopywritingAddon
                        ? `+$${Math.round(copywritingCost).toLocaleString()}`
                        : isPublicationAddon
                          ? '$500 discount'
                          : price >= 0
                            ? `+$${price.toLocaleString()}`
                            : `−$${Math.abs(price).toLocaleString()}`
                    return (
                    <label
                      key={addon.id}
                      className={`flex items-start gap-3 cursor-pointer group addon-option ${selectedAddonIds.has(addon.id) ? 'addon-option-selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAddonIds.has(addon.id)}
                        onChange={() => toggleAddon(addon.id)}
                        className="mt-1.5 w-4 h-4 flex-shrink-0 rounded border-white/30 bg-white/5 text-white focus:ring-white"
                      />
                      <img
                        src={`/imgs/${addon.icon}`}
                        alt=""
                        className="w-6 h-6 flex-shrink-0 mt-0.5 object-contain opacity-90"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-base md:text-lg font-medium text-white tracking-tighter">
                          {priceStr} — {addon.title}
                        </span>
                        <p className="text-sm opacity-60 tracking-tighter mt-0.5">{addon.description}</p>
                      </div>
                    </label>
                    )
                  })}
                </div>
                <div className="pt-8 border-t border-white/10 space-y-2">
                  <div className="text-base md:text-lg opacity-60 tracking-tighter font-normal">
                    {formatInvestment(summaryTotalCost, installmentsSelected)}
                  </div>
                  <div className="text-2xl md:text-3xl font-normal text-white tracking-tighter heading-large">
                    Delivery in: {deliveryDaysDisplay} work days
                  </div>
                  <button type="button" onClick={() => setShowDetailedCalculation(!showDetailedCalculation)} className="text-sm md:text-base opacity-60 hover:opacity-100 transition-opacity tracking-tighter underline block">
                    {showDetailedCalculation ? 'Hide' : 'Detailed Calculation'}
                  </button>
                  {showDetailedCalculation && (
                    <div className="pt-4">
                      <StagesTable
                        stageDays={effectiveStageDays}
                        originalDays={effectiveOriginalDays}
                        likeThat={likeThat}
                        uploadContent={uploadContent}
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    <button type="button" onClick={() => goToStep(2)} className="flex-1 min-w-0 md:flex-initial px-6 py-4 bg-white/10 text-white text-base font-medium rounded-lg hover:bg-white/15 transition-colors duration-200 tracking-tighter">Back</button>
                    <button type="button" onClick={() => goToStep(4)} className="flex-1 min-w-0 md:flex-initial px-8 py-4 bg-white text-black text-base font-medium rounded-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-200 tracking-tighter">{nextStepLabel ? `Next: ${nextStepLabel}` : 'Next step'}</button>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col max-w-2xl pb-8">
            {requestSubmitted ? (
              <div className="text-center py-12">
                <div className="mb-6">
                  <svg className="w-16 h-16 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl md:text-3xl font-normal heading-large mb-4">Thank you!</h3>
                <p className="text-base md:text-lg opacity-60 tracking-tighter">
                  Your request has been sent successfully. We will contact you soon.
                </p>
              </div>
            ) : (
              <>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    setSubmitError(null)
                    setSubmitting(true)
                    const form = e.currentTarget
                    const name = (form.elements.namedItem('name') as HTMLInputElement)?.value?.trim() ?? ''
                    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value?.trim() ?? ''
                    const projectDescription = (form.elements.namedItem('projectDescription') as HTMLTextAreaElement)?.value?.trim() ?? ''
                    const goal = `${SITE_TYPES[siteTypeIndex].title} (${pages} pages)`
                    const scopeLabel = getAnimationLabel(animation)
                    const reduceOptionsList: string[] = []
                    if (likeThat) reduceOptionsList.push('Conduct research yourself')
                    if (uploadContent) reduceOptionsList.push('Upload content yourself')
                    if (subscription) reduceOptionsList.push(`Subscription −${100 - config.subscriptionPct}%`)
                    if (paymentUpfront) reduceOptionsList.push(`Pay upfront −${100 - config.upfrontPct}%`)
                    if (linkToUs) reduceOptionsList.push(`Link to us −${100 - config.linkPct}%`)
                    const addonsList = ADDONS.filter((a) => selectedAddonIds.has(a.id)).map((a) => {
                      if (a.id === 'research') return `${a.title} +2 days ($${Math.round(2 * dayRate).toLocaleString()})`
                      if (a.id === 'copywriting') return `${a.title} +$${Math.round((originalDays.wireframes / 2) * dayRate).toLocaleString()}`
                      const p = config.addonPrices[a.id] ?? a.price
                      return p >= 0 ? `${a.title} +$${p.toLocaleString()}` : `${a.title} −$${Math.abs(p).toLocaleString()}`
                    })
                    const preferredContact = 'Email'
                    const fullSummary = [
                      `Submitted: ${new Date().toLocaleString()}`,
                      `Name: ${name}`,
                      `Email: ${email}`,
                      projectDescription ? `Project: ${projectDescription}` : null,
                      `Goal: ${goal}`,
                    ].filter(Boolean).concat([
                      `Scope: ${scopeLabel}`,
                      `Step 3: ${step3Version === 'reduce' ? 'Reduce cost' : 'Add options'}`,
                      step3Version === 'reduce' ? `Reduce options: ${reduceOptionsList.join(', ') || '—'}` : `Addons: ${addonsList.join(', ') || '—'}`,
                      `Total: ${deliveryDaysDisplay} work days, $${Math.round(summaryTotalCost).toLocaleString()}`,
                    ]).join('\n')
                    const payload: LeadPayload = {
                      goal,
                      scope: scopeLabel,
                      step3Type: step3Version,
                      reduceOptions: reduceOptionsList,
                      addons: addonsList,
                      totalDays: effectiveTotalDays,
                      totalCost: Math.round(summaryTotalCost),
                      preferredContact,
                      projectDescription: projectDescription || undefined,
                      fullSummary,
                    }
                    const { ok, error } = await submitLead(name, email, payload)
                    setSubmitting(false)
                    if (!ok) {
                      setSubmitError(error ?? 'Failed to send')
                      return
                    }
                    trackConfiguratorLead({ total_days: effectiveTotalDays, total_cost: Math.round(summaryTotalCost) })
                    setRequestSubmitted(true)
                  }}
                  className="flex flex-col"
                >
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <label className="block min-w-0 overflow-visible">
                        <span className="text-sm opacity-60 tracking-tighter block mb-1.5">Enter your name</span>
                        <input
                          type="text"
                          required
                          name="name"
                          className="w-full px-4 py-3 bg-white/5 rounded-lg text-white placeholder:text-white/25 tracking-tighter border border-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent [&:not(:placeholder-shown)]:border-white/30 transition-colors"
                          placeholder="Sam Altman"
                        />
                      </label>
                      <label className="block min-w-0 overflow-visible">
                        <span className="text-sm opacity-60 tracking-tighter block mb-1.5">Enter your email</span>
                        <input
                          type="email"
                          required
                          name="email"
                          className="w-full px-4 py-3 bg-white/5 rounded-lg text-white placeholder:text-white/25 tracking-tighter border border-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent [&:not(:placeholder-shown)]:border-white/30 transition-colors"
                          placeholder="sam@openai.com"
                        />
                      </label>
                    </div>

                    <label className="block mb-6">
                      <span className="text-sm opacity-60 tracking-tighter block mb-1.5">Tell us about your project</span>
                      <textarea
                        name="projectDescription"
                        rows={4}
                        className="w-full px-4 py-3 bg-white/5 rounded-lg text-white placeholder:text-white/25 tracking-tighter border border-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                        placeholder="Describe your project, goals, references. Add a link to your site if you have one."
                      />
                    </label>

                  </div>

                  <div className="flex-shrink-0 pt-6 border-t border-white/10 space-y-2">
                    <div className="text-base md:text-lg opacity-60 tracking-tighter font-normal">
                      {formatInvestment(summaryTotalCost, showPaymentSplit)}
                    </div>
                    <div className="text-2xl md:text-3xl font-normal text-white tracking-tighter heading-large">
                      Delivery in: {deliveryDaysDisplay} work days
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDetailedCalculation(!showDetailedCalculation)}
                      className="text-sm md:text-base opacity-60 hover:opacity-100 transition-opacity tracking-tighter underline block"
                    >
                      Detailed Calculation
                    </button>
                    {showDetailedCalculation && (
                      <div className="pt-4 max-h-40 overflow-y-auto">
                        <StagesTable
                          stageDays={effectiveStageDays}
                          originalDays={effectiveOriginalDays}
                          likeThat={likeThat}
                          uploadContent={uploadContent}
                        />
                        <button
                          type="button"
                          onClick={() => setShowDetailedCalculation(false)}
                          className="text-sm opacity-60 hover:opacity-100 underline mt-4"
                        >
                          Hide
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => goToStep(3)}
                        className="order-2 md:order-1 w-full md:w-auto flex-shrink-0 px-6 py-4 bg-white/10 text-white text-base font-medium rounded-lg hover:bg-white/15 transition-colors duration-200 tracking-tighter"
                      >
                        Back
                      </button>
                      {submitError && (
                      <p className="text-sm text-red-400 tracking-tighter order-first md:order-none col-span-2 md:col-span-1">
                        {submitError}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:flex gap-3 order-1 md:order-2 flex-1 min-w-0">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full min-w-0 px-4 md:px-8 py-4 bg-white text-black text-base font-medium rounded-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-200 tracking-tighter disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? 'Sending…' : 'Send'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </>
            )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fixed footer removed — Total/Cost in right column on all steps */}
      {false && step === 3 && (
      <div className="fixed bottom-0 left-0 right-0 pt-16 pb-6 pointer-events-none" style={{
        background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 85%, rgba(0,0,0,0) 100%)'
      }}>
        <div className="max-w-4xl mx-auto px-6 pointer-events-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-8">
            <div className="space-y-2 flex-1 w-full md:w-auto">
              <div className="text-xl md:text-2xl font-medium tracking-tighter opacity-60">
                Total: {totalDays} days
              </div>
              <div className="space-y-2">
                {hasDiscounts ? (
                  <>
                    <div className="text-2xl md:text-4xl font-normal price-large flex items-center gap-4">
                      <span className="line-through opacity-50 text-white/50">${Math.round(baseCost).toLocaleString()}</span>
                      <span className="text-white">${Math.round(totalCost).toLocaleString()}</span>
                    </div>
                    <div className="text-xs md:text-sm opacity-60 tracking-tighter">
                      {discounts.join(', ')}
                    </div>
                  </>
                ) : (
                  <div className="text-2xl md:text-4xl font-normal price-large">
                    Total Cost: ${Math.round(totalCost).toLocaleString()}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowDetailedCalculation(!showDetailedCalculation)}
                className="text-sm md:text-base opacity-60 hover:opacity-100 transition-opacity tracking-tighter underline mt-2"
              >
                {showDetailedCalculation ? 'Hide' : 'Detailed Calculation'}
              </button>
            </div>
            <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="flex-1 min-w-0 md:flex-initial px-6 py-4 bg-white/10 text-white text-base font-medium rounded-lg hover:bg-white/15 transition-colors duration-200 tracking-tighter"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="flex-1 min-w-0 md:flex-initial px-8 py-4 bg-white text-black text-base font-medium rounded-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-200 tracking-tighter"
              >
                {nextStepLabel ? `Next: ${nextStepLabel}` : 'Next step'}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

    </div>
  )
}
