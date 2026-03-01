import { useState, useEffect, useMemo } from 'react'
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
  trackConfiguratorBookCall,
} from '../utils/facebookPixel'
import { parseConfigFromSearchParams } from '../configuratorConfig'
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

/** Gallery: images in public/imgs/animation/ level-1-1.gif … level-5-5.gif */
function AnimationGallerySlot({ level, index, fill16x9 }: { level: number; index: number; fill16x9?: boolean }) {
  const src = `/imgs/animation/level-${level}-${index}.gif`
  return (
    <div className={`overflow-hidden bg-white/5 relative ${fill16x9 ? 'w-full h-full' : 'aspect-square rounded-lg border border-white/10'}`}>
      <img
        src={src}
        alt={`${getAnimationLabel(level)} example ${index}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          const el = e.currentTarget
          el.style.display = 'none'
          const placeholder = el.nextElementSibling as HTMLElement
          if (placeholder) placeholder.classList.remove('hidden')
        }}
      />
      <div className="hidden absolute inset-0 flex items-center justify-center text-white/30 text-xs tracking-tighter">
        GIF
      </div>
    </div>
  )
}

const SITE_TYPES = [
  { title: 'Promo Site', subtitle: '1 page website', pages: 1, icon: 'Promo.svg' },
  { title: 'SaaS Product Site', subtitle: '3-5 page website', pages: 4, icon: 'SaaS.svg' },
  { title: 'Corporate Site', subtitle: '5-9 page website', pages: 7, icon: 'Corporate.svg' },
  { title: 'Enterprise Site', subtitle: '15-30 page website', pages: 22, icon: 'Enterprise.svg' },
] as const

const ADDONS = [
  { id: 'research', price: 1300, title: 'Extensive Research', description: 'We will interview up to 10 stakeholders', badge: true, icon: 'Research.svg' },
  { id: 'copywriting', price: 3900, title: 'Professional Copywriting', description: 'We will write the content for your website', badge: false, icon: 'Copywriting.svg' },
  { id: 'secret', price: 1950, title: 'Keep it secret', description: 'No one will ever know that the website was done by us', badge: false, icon: 'Secret.svg' },
  { id: 'installments', price: 3900, title: 'Pay in installments', description: 'Reduce your upfront costs', badge: true, icon: 'Installments.svg' },
] as const

function calculateStageDays(pages: number, animation: number, baseDaysPerPage: number): StageDays {
  const pagesDays = (pages - 1) * baseDaysPerPage

  let research = Math.max(1, Math.round(1 + pagesDays * 0.2))
  let designConcept = Math.max(1, Math.round(1 + pagesDays * 0.2))
  let wireframes = Math.max(0, Math.round(0.5 + pagesDays * 0.15))
  let highFidelity = Math.max(1, Math.round(1 + pagesDays * 0.2))
  let dev = Math.max(1, Math.round(1.5 + pagesDays * 0.2))
  let qa = Math.max(0, Math.round(0 + pagesDays * 0.05))

  const animationBonus = (animation - 2) * 2

  research = Math.max(1, research + Math.round(animationBonus * 0.1))
  designConcept = Math.max(1, designConcept + Math.round(animationBonus * 0.15))
  wireframes = Math.max(0, wireframes + Math.round(animationBonus * 0.1))
  highFidelity = Math.max(1, highFidelity + Math.round(animationBonus * 0.25))
  dev = Math.max(1, dev + Math.round(animationBonus * 0.3))
  qa = Math.max(0, qa + Math.round(animationBonus * 0.1))

  return {
    research,
    designConcept,
    wireframes,
    highFidelity,
    dev,
    qa,
  }
}

/** Step 3 variant for A/B: reduce = lower cost, increase = add-ons */
function isStep3Increase(v: string | null): boolean {
  return v === '1'
}

/**
 * Single URL: everything on /. Steps change via ?step=1|2|3|4.
 * Params: step, v=0|1 (step 3), preset=0|1 (preselection). Math from ?rate_reduce=, addon_*=, etc.
 */

export default function ConfiguratorPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const config = useMemo(() => parseConfigFromSearchParams(searchParams), [searchParams])
  /** Step from URL (1–4) */
  const step = Math.min(4, Math.max(1, parseInt(searchParams.get('step') || '1', 10) || 1)) as 1 | 2 | 3 | 4
  /** Step 3 variant: v=1 → increase, else reduce */
  const step3Version: 'reduce' | 'increase' = searchParams.get('v') === '1' ? 'increase' : 'reduce'
  /** Light or dark theme (theme=light in URL) */
  const theme = searchParams.get('theme') === 'light' ? 'light' : 'dark'
  /** Rate per day: from URL ?rate= or default for step 3 variant */
  const defaultDayRate = step3Version === 'reduce' ? config.rateReduce : config.rateIncrease
  const rateParam = searchParams.get('rate')
  const dayRate = (rateParam != null && rateParam !== '' && !Number.isNaN(Number(rateParam)) && Number(rateParam) > 0)
    ? Math.round(Number(rateParam))
    : defaultDayRate

  const goToStep = (n: number) => {
    const toStep = Math.min(4, Math.max(1, n))
    trackConfiguratorNavigate(toStep > step ? 'next' : 'back', step, toStep)
    const next = new URLSearchParams(searchParams)
    next.set('step', String(toStep))
    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  useEffect(() => {
    trackConfiguratorStep(step)
  }, [step])

  // URL params: v=0|1 (step 3), preset=0|1 (button preselection)
  const getInitialPreset = () => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('preset')
  }
  const [siteTypeIndex, setSiteTypeIndex] = useState(() => {
    const p = getInitialPreset()
    if (p === '0') return 0   // cheapest — Promo Site (1 page)
    if (p === '1') return 3   // most expensive — Enterprise (15–30 pages)
    return 3
  })
  const pages = config.sitePages[siteTypeIndex] ?? SITE_TYPES[siteTypeIndex].pages
  const [animation, setAnimation] = useState(() => {
    const p = getInitialPreset()
    if (p === '0') return 1   // lightest/cheapest animation — Basic
    if (p === '1') return 4   // most expensive animation — Immersive
    return 3
  })
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
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set())
  /** Call date/time (step 4) */
  const callDateOptions = useMemo(() => {
    const out: { value: string; label: string }[] = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      out.push({
        value: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
      })
    }
    return out
  }, [])
  const callTimeOptions = useMemo(() => {
    const out: { value: string; label: string }[] = []
    for (let h = 9; h <= 18; h++) {
      for (const m of [0, 30]) {
        if (h === 18 && m === 30) break
        out.push({
          value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
          label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        })
      }
    }
    return out
  }, [])
  const [callDate, setCallDate] = useState(() => callDateOptions[0]?.value ?? '')
  const [callTime, setCallTime] = useState(() => callTimeOptions[0]?.value ?? '')
  /** Request mode on step 4: email (default) or book call */
  const [requestMode, setRequestMode] = useState<'email' | 'call'>('email')

  const baseDays = calculateStageDays(pages, animation, config.baseDaysPerPage)
  const [originalDays, setOriginalDays] = useState<StageDays>(baseDays)
  const [stageDays, setStageDays] = useState<StageDays>(baseDays)

  const updateDays = (newPages: number, newAnimation: number) => {
    const newOriginalDays = calculateStageDays(newPages, newAnimation, config.baseDaysPerPage)
    setOriginalDays(newOriginalDays)
    let research = newOriginalDays.research
    if (likeThat) research = Math.max(0, research - config.likeThatDays)
    let wireframes = newOriginalDays.wireframes
    if (uploadContent) wireframes = Math.max(0, wireframes - config.uploadContentDays)
    setStageDays({ ...newOriginalDays, research, wireframes })
  }

  const handleSiteTypeSelect = (index: number) => {
    const site = SITE_TYPES[index]
    trackConfiguratorGoal(site.title, site.pages)
    setSiteTypeIndex(index)
    updateDays(site.pages, animation)
  }

  const handleAnimationLevelSelect = (value: number) => {
    trackConfiguratorScope(getAnimationLabel(value), value)
    setAnimation(value)
    updateDays(pages, value)
  }

  const handleLikeThatChange = (checked: boolean) => {
    setLikeThat(checked)
    const currentOriginal = calculateStageDays(pages, animation, config.baseDaysPerPage)
    setOriginalDays(currentOriginal)
    const newResearch = checked ? Math.max(0, currentOriginal.research - config.likeThatDays) : currentOriginal.research
    const newWireframes = uploadContent ? Math.max(0, currentOriginal.wireframes - config.uploadContentDays) : currentOriginal.wireframes
    setStageDays({ ...currentOriginal, research: newResearch, wireframes: newWireframes })
  }

  const handleUploadContentChange = (checked: boolean) => {
    trackConfiguratorOption('upload_content_yourself', checked)
    setUploadContent(checked)
    const currentOriginal = calculateStageDays(pages, animation, config.baseDaysPerPage)
    setOriginalDays(currentOriginal)
    const newWireframes = checked ? Math.max(0, currentOriginal.wireframes - config.uploadContentDays) : currentOriginal.wireframes
    const newResearch = likeThat ? Math.max(0, currentOriginal.research - config.likeThatDays) : currentOriginal.research
    setStageDays({ ...currentOriginal, research: newResearch, wireframes: newWireframes })
  }

  const totalDays = Object.values(stageDays).reduce((sum, days) => sum + days, 0)
  const baseTotalDays = Object.values(calculateStageDays(pages, animation, config.baseDaysPerPage)).reduce((sum, days) => sum + days, 0)
  const baseCost = baseTotalDays * dayRate
  const currentCost = totalDays * dayRate
  const discounts: string[] = []
  let totalCost = currentCost
  if (likeThat) discounts.push('Conduct research yourself')
  if (uploadContent) discounts.push('Upload content yourself')
  if (subscription) { totalCost *= config.subscriptionPct / 100; discounts.push(`Subscription −${100 - config.subscriptionPct}%`) }
  if (paymentUpfront) { totalCost *= config.upfrontPct / 100; discounts.push(`Pay upfront −${100 - config.upfrontPct}%`) }
  if (linkToUs) { totalCost *= config.linkPct / 100; discounts.push(`Link to us −${100 - config.linkPct}%`) }
  const addonsTotal = ADDONS.filter((a) => selectedAddonIds.has(a.id)).reduce(
    (sum, a) => sum + (config.addonPrices[a.id] ?? a.price),
    0
  )
  const summaryTotalCost = totalCost + addonsTotal
  const hasDiscounts = discounts.length > 0 || totalDays < baseTotalDays

  /** Weeks for payment split (5 work days = 1 week) */
  const workWeeks = Math.max(1, Math.ceil(totalDays / 5))
  /** Show "X/week for N weeks (Total)" when installments addon is selected */
  const showPaymentSplit = selectedAddonIds.has('installments')
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
                <AnimationGallerySlot level={animation} index={1} fill16x9 />
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
                  Delivery in: {totalDays} work days
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
                      stageDays={stageDays}
                      originalDays={originalDays}
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
                <AnimationGallerySlot level={animation} index={1} fill16x9 />
              </div>
            </div>
          </div>
          <div className={`flex flex-col min-h-0 flex-1 lg:h-full w-full px-6 lg:px-12 lg:pl-10 py-6 lg:py-12 order-2 lg:order-2 ${step === 4 ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal mb-4 heading-large">
                {step === 3 && (isStep3Increase(searchParams.get('v')) ? 'Add options' : 'Reduce cost')}
                {step === 4 && 'Leave a request'}
              </h1>
              <p className="text-base md:text-lg opacity-60 tracking-tighter">
                {step === 3 && (isStep3Increase(searchParams.get('v')) ? 'Add options to increase the value and scope of your project' : 'Choose options to lower the project cost')}
                {step === 4 && 'Send your request and we will contact you to discuss the project'}
              </p>
            </div>
            {stepIndicator}
            {step === 3 && !isStep3Increase(searchParams.get('v')) && (
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
                      stageDays={stageDays}
                      originalDays={originalDays}
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
                    Delivery in: {totalDays} work days
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

            {step === 3 && isStep3Increase(searchParams.get('v')) && (
              <div className="space-y-8">
                <p className="text-base md:text-lg opacity-60 tracking-tighter">
                  Add options to increase the value and scope of your project
                </p>
                <div className="space-y-4 mb-8">
                  {ADDONS.map((addon) => (
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
                          +${(config.addonPrices[addon.id] ?? addon.price).toLocaleString()} — {addon.title}
                        </span>
                        <p className="text-sm opacity-60 tracking-tighter mt-0.5">{addon.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="pt-8 border-t border-white/10 space-y-2">
                  <div className="text-base md:text-lg opacity-60 tracking-tighter font-normal">
                    {formatInvestment(totalCost + addonsTotal, selectedAddonIds.has('installments'))}
                  </div>
                  <div className="text-2xl md:text-3xl font-normal text-white tracking-tighter heading-large">
                    Delivery in: {totalDays} work days
                  </div>
                  <button type="button" onClick={() => setShowDetailedCalculation(!showDetailedCalculation)} className="text-sm md:text-base opacity-60 hover:opacity-100 transition-opacity tracking-tighter underline block">
                    {showDetailedCalculation ? 'Hide' : 'Detailed Calculation'}
                  </button>
                  {showDetailedCalculation && (
                    <div className="pt-4">
                      <StagesTable
                        stageDays={stageDays}
                        originalDays={originalDays}
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
              <div className="flex flex-col flex-1 min-h-0 max-w-2xl overflow-visible">
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
                    const goal = `${SITE_TYPES[siteTypeIndex].title} (${pages} pages)`
                    const scopeLabel = getAnimationLabel(animation)
                    const reduceOptionsList: string[] = []
                    if (likeThat) reduceOptionsList.push('Conduct research yourself')
                    if (uploadContent) reduceOptionsList.push('Upload content yourself')
                    if (subscription) reduceOptionsList.push(`Subscription −${100 - config.subscriptionPct}%`)
                    if (paymentUpfront) reduceOptionsList.push(`Pay upfront −${100 - config.upfrontPct}%`)
                    if (linkToUs) reduceOptionsList.push(`Link to us −${100 - config.linkPct}%`)
                    const addonsList = ADDONS.filter((a) => selectedAddonIds.has(a.id)).map(
                      (a) => `${a.title} +$${(config.addonPrices[a.id] ?? a.price).toLocaleString()}`
                    )
                    const preferredContact = requestMode === 'email' ? 'Get proposal to email' : `Book call: ${callDate} ${callTime}`
                    const fullSummary = [
                      `Date: ${new Date().toLocaleString()}`,
                      `Name: ${name}`,
                      `Email: ${email}`,
                      `Preferred: ${preferredContact}`,
                      `Goal: ${goal}`,
                      `Scope: ${scopeLabel}`,
                      `Step 3: ${step3Version === 'reduce' ? 'Reduce cost' : 'Add options'}`,
                      step3Version === 'reduce' ? `Reduce options: ${reduceOptionsList.join(', ') || '—'}` : `Addons: ${addonsList.join(', ') || '—'}`,
                      `Total: ${totalDays} work days, $${Math.round(summaryTotalCost).toLocaleString()}`,
                    ].join('\n')
                    const payload: LeadPayload = {
                      goal,
                      scope: scopeLabel,
                      step3Type: step3Version,
                      reduceOptions: reduceOptionsList,
                      addons: addonsList,
                      totalDays,
                      totalCost: Math.round(summaryTotalCost),
                      preferredContact,
                      fullSummary,
                    }
                    const { ok, error } = await submitLead(name, email, payload)
                    setSubmitting(false)
                    if (!ok) {
                      setSubmitError(error ?? 'Failed to send')
                      return
                    }
                    trackConfiguratorLead({ total_days: totalDays, total_cost: Math.round(summaryTotalCost) })
                    if (requestMode === 'call') trackConfiguratorBookCall()
                    setRequestSubmitted(true)
                  }}
                  className="flex flex-col flex-1 min-h-0 overflow-visible"
                >
                  <div className="flex-1 min-h-0 overflow-visible">
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

                    <div className="mb-6">
                      <span className="text-sm opacity-60 tracking-tighter block mb-3">How would you like to proceed?</span>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="radio"
                            name="requestMode"
                            checked={requestMode === 'email'}
                            onChange={() => setRequestMode('email')}
                            className="w-3.5 h-3.5 rounded-full border border-white/40 bg-transparent text-white accent-white focus:ring-1 focus:ring-white/50 focus:ring-offset-0 focus:outline-none cursor-pointer"
                          />
                          <span className="text-sm tracking-tighter text-white/90">Get proposal to email</span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="radio"
                            name="requestMode"
                            checked={requestMode === 'call'}
                            onChange={() => setRequestMode('call')}
                            className="w-3.5 h-3.5 rounded-full border border-white/40 bg-transparent text-white accent-white focus:ring-1 focus:ring-white/50 focus:ring-offset-0 focus:outline-none cursor-pointer"
                          />
                          <span className="text-sm tracking-tighter text-white/90">Book 30-min call</span>
                        </label>
                      </div>
                    </div>

                    {requestMode === 'call' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <label className="block min-w-0">
                          <span className="text-sm opacity-60 tracking-tighter block mb-1.5">Call date</span>
                          <input
                            type="date"
                            value={callDate}
                            min={callDateOptions[0]?.value}
                            max={callDateOptions[callDateOptions.length - 1]?.value}
                            onChange={(e) => setCallDate(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 rounded-lg text-white tracking-tighter border border-white/10 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors [color-scheme:dark]"
                          />
                        </label>
                        <label className="block min-w-0">
                          <span className="text-sm opacity-60 tracking-tighter block mb-1.5">Call time</span>
                          <select
                            value={callTime}
                            onChange={(e) => setCallTime(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 rounded-lg text-white tracking-tighter border border-white/10 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors"
                          >
                            {callTimeOptions.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-neutral-900 text-white">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 pt-6 border-t border-white/10 space-y-2">
                    <div className="text-base md:text-lg opacity-60 tracking-tighter font-normal">
                      {formatInvestment(summaryTotalCost, showPaymentSplit)}
                    </div>
                    <div className="text-2xl md:text-3xl font-normal text-white tracking-tighter heading-large">
                      Delivery in: {totalDays} work days
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
                          stageDays={stageDays}
                          originalDays={originalDays}
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
