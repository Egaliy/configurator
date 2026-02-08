import { useState } from 'react'
import Slider from './components/Slider'
import StagesTable from './components/StagesTable'
import Configurator from './components/Configurator'
import SubmitButton from './components/SubmitButton'
import RequestForm from './components/RequestForm'

const DAY_RATE = 1500

interface StageDays {
  research: number
  designConcept: number
  wireframes: number
  highFidelity: number
  dev: number
  qa: number
}

function getAnimationLabel(value: number): string {
  const labels: { [key: number]: string } = {
    1: 'No animation',
    2: 'Easy animation',
    3: 'Complex animation',
    4: 'Video generation',
    5: '3D scene creation',
  }
  return labels[value] || 'Animation Complexity'
}

function calculateStageDays(pages: number, animation: number): StageDays {
  // Base: 1 page + Easy animation (2) = 5 days total
  // Each more complex animation level adds +2 days
  // Animation levels: 1=No, 2=Easy, 3=Complex, 4=Video, 5=3D
  
  // Base days for 1 page with Easy animation (animation=2) = 5 days
  // Distribute: Research(1) + Design(1) + Wireframes(0.5) + High-fidelity(1) + Dev(1.5) + QA(0) = 5
  const baseDaysPerPage = 2.5 // Average days per page for base calculation
  const pagesDays = (pages - 1) * baseDaysPerPage // Additional days for extra pages
  
  // Base distribution for 1 page
  let research = Math.max(1, Math.round(1 + pagesDays * 0.2))
  let designConcept = Math.max(1, Math.round(1 + pagesDays * 0.2))
  let wireframes = Math.max(0, Math.round(0.5 + pagesDays * 0.15))
  let highFidelity = Math.max(1, Math.round(1 + pagesDays * 0.2))
  let dev = Math.max(1, Math.round(1.5 + pagesDays * 0.2))
  let qa = Math.max(0, Math.round(0 + pagesDays * 0.05))
  
  // Animation bonus: Easy(2) = 0, Complex(3) = +2, Video(4) = +4, 3D(5) = +6
  // No animation(1) = -2 days
  const animationBonus = (animation - 2) * 2
  
  // Distribute animation bonus (more to Dev and High-fidelity)
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

function App() {
  const [pagesSlider, setPagesSlider] = useState(1)
  const [customPages, setCustomPages] = useState<number | null>(null)
  const [customPagesInput, setCustomPagesInput] = useState<string>('')
  const pages = pagesSlider === 5 && customPages !== null ? customPages : pagesSlider
  const [animation, setAnimation] = useState(3)
  const [animationChanged, setAnimationChanged] = useState(false)
  const [likeThat, setLikeThat] = useState(false)
  const [uploadContent, setUploadContent] = useState(false)
  const [subscription, setSubscription] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [paymentUpfront, setPaymentUpfront] = useState(false)
  const [linkToUs, setLinkToUs] = useState(false)
  const [showDetailedCalculation, setShowDetailedCalculation] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)

  const baseDays = calculateStageDays(pages, animation)
  const [originalDays, setOriginalDays] = useState<StageDays>(baseDays)
  const [stageDays, setStageDays] = useState<StageDays>(baseDays)

  const updateDays = (newPages: number, newAnimation: number) => {
    const newOriginalDays = calculateStageDays(newPages, newAnimation)
    setOriginalDays(newOriginalDays)
    
    // Apply reductions
    let research = newOriginalDays.research
    if (likeThat) {
      research = Math.max(0, research - 1)
    }

    let wireframes = newOriginalDays.wireframes
    if (uploadContent) {
      wireframes = Math.max(0, wireframes - 1)
    }

    setStageDays({
      ...newOriginalDays,
      research,
      wireframes,
    })
  }

  const handlePagesChange = (value: number) => {
    setPagesSlider(value)
    let actualPages = value
    if (value === 5) {
      if (customPages === null) {
        setCustomPages(5)
        setCustomPagesInput('')
        actualPages = 5
      } else {
        actualPages = customPages
      }
    } else {
      setCustomPages(null)
      setCustomPagesInput('')
      actualPages = value
    }
    updateDays(actualPages, animation)
  }

  const handleCustomPagesChange = (value: string) => {
    // Разрешаем только цифры
    const digitsOnly = value.replace(/\D/g, '')
    
    if (digitsOnly === '') {
      setCustomPagesInput('')
      setCustomPages(5)
      updateDays(5, animation)
    } else {
      const numValue = parseInt(digitsOnly)
      if (!isNaN(numValue)) {
        // Ограничиваем максимум 25
        if (numValue > 25) {
          setCustomPagesInput('25')
          setCustomPages(25)
          updateDays(25, animation)
        } else {
          setCustomPagesInput(digitsOnly)
          const validValue = Math.max(5, numValue)
          setCustomPages(validValue)
          updateDays(validValue, animation)
        }
      } else {
        setCustomPagesInput('')
      }
    }
  }

  const handleCustomPagesBlur = () => {
    if (customPagesInput === '' || customPagesInput === null) {
      setCustomPages(5)
      setCustomPagesInput('')
      updateDays(5, animation)
    } else {
      const numValue = parseInt(customPagesInput)
      if (isNaN(numValue) || numValue < 5) {
        setCustomPages(5)
        setCustomPagesInput('')
        updateDays(5, animation)
      } else {
        const validValue = Math.min(25, Math.max(5, numValue))
        setCustomPages(validValue)
        setCustomPagesInput(validValue.toString())
        updateDays(validValue, animation)
      }
    }
  }

  const handleCustomPagesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const currentValue = customPages || 5
      const newValue = Math.min(25, currentValue + 1)
      setCustomPages(newValue)
      setCustomPagesInput(newValue.toString())
      updateDays(newValue, animation)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const currentValue = customPages || 5
      const newValue = Math.max(5, currentValue - 1)
      setCustomPages(newValue)
      setCustomPagesInput(newValue.toString())
      updateDays(newValue, animation)
    }
  }

  const handleAnimationChange = (value: number) => {
    setAnimation(value)
    setAnimationChanged(true)
    updateDays(pages, value)
  }

  const handleLikeThatChange = (checked: boolean) => {
    setLikeThat(checked)
    const currentOriginal = calculateStageDays(pages, animation)
    setOriginalDays(currentOriginal)
    const newResearch = checked 
      ? Math.max(0, currentOriginal.research - 1)
      : currentOriginal.research
    setStageDays({ ...currentOriginal, research: newResearch })
  }

  const handleUploadContentChange = (checked: boolean) => {
    setUploadContent(checked)
    const currentOriginal = calculateStageDays(pages, animation)
    setOriginalDays(currentOriginal)
    const newWireframes = checked
      ? Math.max(0, currentOriginal.wireframes - 1)
      : currentOriginal.wireframes
    setStageDays({ ...currentOriginal, wireframes: newWireframes })
  }

  const totalDays = Object.values(stageDays).reduce((sum, days) => sum + days, 0)
  
  // Calculate base cost without day reductions
  const baseTotalDays = Object.values(calculateStageDays(pages, animation)).reduce((sum, days) => sum + days, 0)
  const baseCost = baseTotalDays * DAY_RATE
  const currentCost = totalDays * DAY_RATE
  
  // Calculate discounts
  const discounts: string[] = []
  let totalCost = currentCost

  // Day reductions
  if (likeThat) {
    discounts.push('Conduct research yourself')
  }
  if (uploadContent) {
    discounts.push('Upload content yourself')
  }

  // Percentage discounts
  if (subscription) {
    totalCost *= 0.9
    discounts.push('Subscription −10%')
  }
  if (paymentUpfront) {
    totalCost *= 0.9
    discounts.push('Pay upfront −10%')
  }
  if (linkToUs) {
    totalCost *= 0.95
    discounts.push('Link to us −5%')
  }

  const hasDiscounts = discounts.length > 0 || totalDays < baseTotalDays

  return (
    <div className="min-h-screen bg-black text-white px-6 pb-56 max-w-4xl mx-auto">
      <div className="pt-12 mb-12">
        <div className="mb-8">
          <img src="/imgs/logo.png" alt="Logo" className="h-12" />
        </div>
        <h1 className="text-3xl md:text-5xl font-normal mb-4 heading-large">Website Cost Configurator</h1>
        <p className="text-base md:text-lg opacity-60 tracking-tighter">
          Configure your website project parameters and see the estimated cost and timeline
        </p>
      </div>
      
      <div className="space-y-12">
        {/* Sliders */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <Slider
              label="Number of Pages"
              value={pagesSlider}
              min={1}
              max={5}
              onChange={handlePagesChange}
              displayValue={pagesSlider === 5 && customPages !== null ? `${customPages}+` : pagesSlider.toString()}
              customDisplayElement={
                pagesSlider === 5 ? (
                  <input
                    type="text"
                    value={customPagesInput}
                    onChange={(e) => handleCustomPagesChange(e.target.value)}
                    onBlur={handleCustomPagesBlur}
                    onKeyDown={handleCustomPagesKeyDown}
                    className="min-w-40 px-2 py-0 bg-transparent text-white/60 text-base md:text-lg tracking-tighter focus:outline-none text-right caret-white h-auto leading-none placeholder:text-white/60"
                    placeholder="Type your number"
                    autoFocus
                  />
                ) : undefined
              }
            />
          </div>
          <div className="flex-1">
            <Slider
              label="Animation Complexity"
              value={animation}
              min={1}
              max={5}
              onChange={handleAnimationChange}
              displayValue={animationChanged ? getAnimationLabel(animation) : 'Animation Complexity'}
            />
          </div>
        </div>

        {/* Detailed Calculation Toggle */}
        <button
          type="button"
          onClick={() => setShowDetailedCalculation(!showDetailedCalculation)}
          className="text-sm md:text-base opacity-60 hover:opacity-100 transition-opacity tracking-tighter underline"
        >
          {showDetailedCalculation ? 'Hide' : 'Detailed Calculation'}
        </button>

        {/* Stages Table - Hidden by default */}
        {showDetailedCalculation && (
          <StagesTable 
            stageDays={stageDays} 
            originalDays={originalDays}
            likeThat={likeThat} 
            uploadContent={uploadContent} 
          />
        )}

        {/* Configurator */}
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

      </div>

      {/* Fixed Footer with Total Days and Cost Summary */}
      <div className="fixed bottom-0 left-0 right-0 pt-16 pb-6 pointer-events-none" style={{
        background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 85%, rgba(0,0,0,0) 100%)'
      }}>
        <div className="max-w-4xl mx-auto px-6 pointer-events-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-8">
            <div className="space-y-2 flex-1 pointer-events-none w-full md:w-auto">
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
            </div>
            <div className="flex items-end pointer-events-auto w-full md:w-auto">
              <SubmitButton onClick={() => setShowRequestForm(true)} />
            </div>
          </div>
        </div>
      </div>

      {/* Request Form Modal */}
      <RequestForm
        isOpen={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        totalCost={totalCost}
        totalDays={totalDays}
      />
    </div>
  )
}

export default App
