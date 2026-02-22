import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import StagesTable from '../components/StagesTable'
import Configurator from '../components/Configurator'
/**
 * Ставка за день: психология версий.
 * - reduce: ставка выше (1670) — база выше, скидки «снижают» цену; средняя итоговая ~ как при 1500.
 * - increase: ставка ниже (1375) — база ниже, допы «поднимают» цену; средняя итоговая та же.
 */
const DAY_RATE_REDUCE = 1670
const DAY_RATE_INCREASE = 1375

interface StageDays {
  research: number
  designConcept: number
  wireframes: number
  highFidelity: number
  dev: number
  qa: number
}

const ANIMATION_LEVELS = [
  { title: 'Basic', subtitle: 'Clean and Elegant', value: 1 },
  { title: 'Advanced', subtitle: 'Premium Motion', value: 2 },
  { title: 'Cinematic', subtitle: 'Hero-Level', value: 3 },
  { title: 'Immersive', subtitle: 'More than a website.', value: 4 },
] as const

function getAnimationLabel(value: number): string {
  const level = ANIMATION_LEVELS.find((l) => l.value === value)
  return level ? level.title : 'Animation'
}

/** Галерея: картинки в public/imgs/animation/ level-1-1.gif … level-5-5.gif */
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
  { title: 'Promo Site', subtitle: '1 page website', pages: 1 },
  { title: 'SaaS Product Site', subtitle: '3-5 page website', pages: 4 },
  { title: 'Corporate Site', subtitle: '5-9 page website', pages: 7 },
  { title: 'Enterprise Site', subtitle: '15-30 page website', pages: 22 },
] as const

const ADDONS = [
  { id: 'research', price: 1300, title: 'Extensive Research', description: 'We will interview up to 10 stakeholders', badge: true },
  { id: 'copywriting', price: 3900, title: 'Professional Copywriting', description: 'We will write the content for your website', badge: false },
  { id: 'secret', price: 1950, title: 'Keep it secret', description: 'No one will ever know that the website was done by us', badge: false },
  { id: 'installments', price: 3900, title: 'Pay in installments', description: 'Reduce your upfront costs', badge: true },
] as const

function calculateStageDays(pages: number, animation: number): StageDays {
  const baseDaysPerPage = 2.5
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

/** Версия шага 3 для A/B: reduce = снижение цены, increase = увеличение (допы) */
function isStep3Increase(v: string | null): boolean {
  return v === '1'
}

/**
 * Один адрес: всё на /. Слайды меняются по ?step=1|2|3|4.
 * Параметры: step, v=0|1 (шаг 3), preset=0|1 (предвыбор). Пример: /?step=2&v=1&preset=1
 */

export default function ConfiguratorPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  /** Шаг из URL (1–4); один адрес, слайды меняются */
  const step = Math.min(4, Math.max(1, parseInt(searchParams.get('step') || '1', 10) || 1)) as 1 | 2 | 3 | 4
  /** Версия шага 3: v=1 → increase, иначе reduce */
  const step3Version: 'reduce' | 'increase' = searchParams.get('v') === '1' ? 'increase' : 'reduce'
  /** Ставка за день: в reduce выше, в increase ниже — средняя итоговая сопоставима. */
  const dayRate = step3Version === 'reduce' ? DAY_RATE_REDUCE : DAY_RATE_INCREASE

  const goToStep = (n: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('step', String(Math.min(4, Math.max(1, n))))
    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  // Параметры URL: v=0|1 (шаг 3), preset=0|1 (предвыбор кнопок)
  const getInitialPreset = () => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('preset')
  }
  const [siteTypeIndex, setSiteTypeIndex] = useState(() => {
    const p = getInitialPreset()
    if (p === 'cheap') return 0
    if (p === 'expensive') return 3
    return 3
  })
  const pages = SITE_TYPES[siteTypeIndex].pages
  const [animation, setAnimation] = useState(() => {
    const p = getInitialPreset()
    if (p === 'cheap') return 1
    if (p === 'expensive') return 4
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
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setGalleryIndex(0)
  }, [animation])

  useEffect(() => {
    const t = setInterval(() => {
      setGalleryIndex((i) => (i + 1) % 5)
    }, 4000)
    return () => clearInterval(t)
  }, [animation])

  const baseDays = calculateStageDays(pages, animation)
  const [originalDays, setOriginalDays] = useState<StageDays>(baseDays)
  const [stageDays, setStageDays] = useState<StageDays>(baseDays)

  const updateDays = (newPages: number, newAnimation: number) => {
    const newOriginalDays = calculateStageDays(newPages, newAnimation)
    setOriginalDays(newOriginalDays)
    let research = newOriginalDays.research
    if (likeThat) research = Math.max(0, research - 1)
    let wireframes = newOriginalDays.wireframes
    if (uploadContent) wireframes = Math.max(0, wireframes - 1)
    setStageDays({ ...newOriginalDays, research, wireframes })
  }

  const handleSiteTypeSelect = (index: number) => {
    setSiteTypeIndex(index)
    updateDays(SITE_TYPES[index].pages, animation)
  }

  const handleAnimationLevelSelect = (value: number) => {
    setAnimation(value)
    updateDays(pages, value)
  }

  const handleLikeThatChange = (checked: boolean) => {
    setLikeThat(checked)
    const currentOriginal = calculateStageDays(pages, animation)
    setOriginalDays(currentOriginal)
    const newResearch = checked ? Math.max(0, currentOriginal.research - 1) : currentOriginal.research
    const newWireframes = uploadContent ? Math.max(0, currentOriginal.wireframes - 1) : currentOriginal.wireframes
    setStageDays({ ...currentOriginal, research: newResearch, wireframes: newWireframes })
  }

  const handleUploadContentChange = (checked: boolean) => {
    setUploadContent(checked)
    const currentOriginal = calculateStageDays(pages, animation)
    setOriginalDays(currentOriginal)
    const newWireframes = checked ? Math.max(0, currentOriginal.wireframes - 1) : currentOriginal.wireframes
    const newResearch = likeThat ? Math.max(0, currentOriginal.research - 1) : currentOriginal.research
    setStageDays({ ...currentOriginal, research: newResearch, wireframes: newWireframes })
  }

  const totalDays = Object.values(stageDays).reduce((sum, days) => sum + days, 0)
  const baseTotalDays = Object.values(calculateStageDays(pages, animation)).reduce((sum, days) => sum + days, 0)
  const baseCost = baseTotalDays * dayRate
  const currentCost = totalDays * dayRate
  const discounts: string[] = []
  let totalCost = currentCost
  if (likeThat) discounts.push('Conduct research yourself')
  if (uploadContent) discounts.push('Upload content yourself')
  if (subscription) { totalCost *= 0.9; discounts.push('Subscription −10%') }
  if (paymentUpfront) { totalCost *= 0.9; discounts.push('Pay upfront −10%') }
  if (linkToUs) { totalCost *= 0.95; discounts.push('Link to us −5%') }
  const addonsTotal = ADDONS.filter((a) => selectedAddonIds.has(a.id)).reduce((sum, a) => sum + a.price, 0)
  const summaryTotalCost = totalCost + addonsTotal
  const hasDiscounts = discounts.length > 0 || totalDays < baseTotalDays

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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
    <div className="mb-8">
      <div className="flex gap-1 mb-4">
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
    <div className={`min-h-screen bg-black text-white pb-0 w-full`}>
      {/* Шаги 1–5: слева картинка (галерея), справа контент */}
      {step <= 2 ? (
        <div key="step1-2" className="grid grid-cols-1 lg:grid-cols-2 w-full min-h-screen lg:h-screen animate-step-in">
          {/* Левая колонка: галерея на всю ширину и высоту половины */}
          <div className="flex flex-col h-screen lg:h-full w-full min-h-0 bg-black order-2 lg:order-1">
            <div className="flex-1 min-h-0 flex flex-col p-2 lg:p-4">
              <div className="flex-1 min-h-0 relative rounded-lg lg:rounded-xl overflow-hidden bg-white/5 border border-white/10 w-full">
                <div
                  className="absolute inset-0 flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${galleryIndex * 100}%)` }}
                >
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="flex-shrink-0 w-full h-full">
                      <AnimationGallerySlot level={animation} index={index} fill16x9 />
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-1.5 py-2 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setGalleryIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === galleryIndex ? 'bg-white' : 'bg-white/40'}`}
                      aria-label={`Case ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Правая колонка: конфигуратор */}
          <div className="flex flex-col h-screen lg:h-full w-full min-h-0 px-6 lg:px-12 lg:pl-10 py-8 lg:py-12 order-1 lg:order-2 overflow-y-auto">
            <div className="mb-8">
              <img src="/imgs/logo.png" alt="Logo" className="h-10 lg:h-12 mb-6" />
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
            {stepIndicator}
            <div className="space-y-10">
              {step === 1 && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {SITE_TYPES.map((site, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSiteTypeSelect(index)}
                      className={`text-left px-4 py-4 sm:px-5 sm:py-5 rounded-xl transition-colors ${
                        siteTypeIndex === index
                          ? 'bg-white/10 border border-white/30'
                          : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
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
                      className={`text-left px-4 py-4 sm:px-5 sm:py-5 rounded-xl transition-colors ${
                        animation === level.value
                          ? 'bg-white/10 border border-white/30'
                          : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
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

              {/* Total, Total Cost, Detailed Calculation — в правой колонке */}
              <div className="mt-10 pt-8 border-t border-white/10 space-y-2">
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
                  className="text-sm md:text-base opacity-60 hover:opacity-100 transition-opacity tracking-tighter underline mt-2 block"
                >
                  {showDetailedCalculation ? 'Hide' : 'Detailed Calculation'}
                </button>
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
          <div className="flex flex-col h-screen lg:h-full w-full min-h-0 bg-black order-2 lg:order-1">
            <div className="flex-1 min-h-0 flex flex-col p-2 lg:p-4">
              <div className="flex-1 min-h-0 relative rounded-lg lg:rounded-xl overflow-hidden bg-white/5 border border-white/10 w-full">
                <div
                  className="absolute inset-0 flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${galleryIndex * 100}%)` }}
                >
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="flex-shrink-0 w-full h-full">
                      <AnimationGallerySlot level={animation} index={index} fill16x9 />
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-1.5 py-2 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setGalleryIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === galleryIndex ? 'bg-white' : 'bg-white/40'}`}
                      aria-label={`Case ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col h-screen lg:h-full w-full min-h-0 px-6 lg:px-12 lg:pl-10 py-8 lg:py-12 order-1 lg:order-2 overflow-y-auto">
            <div className="mb-8">
              <img src="/imgs/logo.png" alt="Logo" className="h-10 lg:h-12 mb-6" />
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal mb-4 heading-large">
                {step === 3 && (isStep3Increase(searchParams.get('v')) ? 'Increase value' : 'Reduce cost')}
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
                  onSubscriptionChange={setSubscription}
                  subscriptionLoading={subscriptionLoading}
                  onSubscriptionLoadingChange={setSubscriptionLoading}
                  paymentUpfront={paymentUpfront}
                  onPaymentUpfrontChange={setPaymentUpfront}
                  linkToUs={linkToUs}
                  onLinkToUsChange={setLinkToUs}
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
                  <div className="text-xl md:text-2xl font-medium tracking-tighter opacity-60">Total: {totalDays} days</div>
                  <div className="space-y-2">
                    {hasDiscounts ? (
                      <>
                        <div className="text-2xl md:text-4xl font-normal price-large flex items-center gap-4">
                          <span className="line-through opacity-50 text-white/50">${Math.round(baseCost).toLocaleString()}</span>
                          <span className="text-white">${Math.round(totalCost).toLocaleString()}</span>
                        </div>
                        <div className="text-xs md:text-sm opacity-60 tracking-tighter">{discounts.join(', ')}</div>
                      </>
                    ) : (
                      <div className="text-2xl md:text-4xl font-normal price-large">Total Cost: ${Math.round(totalCost).toLocaleString()}</div>
                    )}
                  </div>
                  <button type="button" onClick={() => setShowDetailedCalculation(!showDetailedCalculation)} className="text-sm md:text-base opacity-60 hover:opacity-100 transition-opacity tracking-tighter underline mt-2 block">
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
                    <label key={addon.id} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedAddonIds.has(addon.id)}
                        onChange={() => toggleAddon(addon.id)}
                        className="mt-1.5 w-4 h-4 rounded border-white/30 bg-white/5 text-white focus:ring-white"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-base md:text-lg font-medium text-white tracking-tighter">
                          +${addon.price.toLocaleString()} — {addon.title}
                        </span>
                        <p className="text-sm opacity-60 tracking-tighter mt-0.5">{addon.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="pt-8 border-t border-white/10 space-y-2">
                  <div className="text-xl md:text-2xl font-medium tracking-tighter opacity-60">Total: {totalDays} days</div>
                  <div className="text-2xl md:text-4xl font-normal price-large">
                    Total Cost: ${Math.round(totalCost + addonsTotal).toLocaleString()}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    <button type="button" onClick={() => goToStep(2)} className="flex-1 min-w-0 md:flex-initial px-6 py-4 bg-white/10 text-white text-base font-medium rounded-lg hover:bg-white/15 transition-colors duration-200 tracking-tighter">Back</button>
                    <button type="button" onClick={() => goToStep(4)} className="flex-1 min-w-0 md:flex-initial px-8 py-4 bg-white text-black text-base font-medium rounded-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-200 tracking-tighter">{nextStepLabel ? `Next: ${nextStepLabel}` : 'Next step'}</button>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 max-w-2xl">
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
                  onSubmit={(e) => {
                    e.preventDefault()
                    setRequestSubmitted(true)
                  }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm opacity-60 tracking-tighter block mb-1.5">Enter your name</span>
                      <input
                        type="text"
                        required
                        name="name"
                        className="w-full px-4 py-3 bg-white/5 rounded-lg text-white placeholder:text-white/40 tracking-tighter border border-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent [&:not(:placeholder-shown)]:border-white/30 transition-colors"
                        placeholder="Sam Altman"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm opacity-60 tracking-tighter block mb-1.5">Enter your email</span>
                      <input
                        type="email"
                        required
                        name="email"
                        className="w-full px-4 py-3 bg-white/5 rounded-lg text-white placeholder:text-white/40 tracking-tighter border border-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent [&:not(:placeholder-shown)]:border-white/30 transition-colors"
                        placeholder="sam@openai.com"
                      />
                    </label>
                  </div>

                  <div className="py-6 border-t border-white/10 space-y-4">
                    <div className="text-base md:text-lg opacity-60 tracking-tighter">
                      Investment: ${Math.round(summaryTotalCost).toLocaleString()}
                    </div>
                    <div className="text-2xl md:text-3xl font-normal text-white tracking-tighter">
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
                      <div className="pt-4">
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
                  </div>

                  <div className="flex flex-nowrap items-center gap-3 pt-2 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => goToStep(3)}
                      className="flex-shrink-0 px-6 py-4 bg-white/10 text-white text-base font-medium rounded-lg hover:bg-white/15 transition-colors duration-200 tracking-tighter"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-shrink-0 px-6 py-4 bg-white/10 text-white text-base font-medium rounded-lg hover:bg-white/15 transition-colors duration-200 tracking-tighter"
                    >
                      Get proposal to email
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestSubmitted(true)}
                      className="flex-shrink-0 px-8 py-4 bg-white text-black text-base font-medium rounded-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-200 tracking-tighter"
                    >
                      Book a 30-minute discovery call
                    </button>
                  </div>
                </form>
              </>
            )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fixed footer убран — Total/Cost в правой колонке на всех шагах */}
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
