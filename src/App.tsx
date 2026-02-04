import { useState } from 'react'
import Slider from './components/Slider'
import StagesTable from './components/StagesTable'
import Configurator from './components/Configurator'
import SubmitButton from './components/SubmitButton'

const DAY_RATE = 1500

interface StageDays {
  research: number
  designConcept: number
  wireframes: number
  highFidelity: number
  dev: number
  qa: number
}

function calculateStageDays(pages: number, animation: number): StageDays {
  const research = Math.max(1, Math.round(1 + pages / 5 + animation / 3))
  const designConcept = Math.round(2 + pages / 4 + animation / 2)
  const wireframes = Math.round(2 + pages / 6 + animation / 3)
  const highFidelity = Math.round(3 + pages / 3 + animation / 2)
  const dev = Math.round(5 + pages * 0.8 + animation * 2)
  const qa = Math.round(2 + pages / 5 + animation / 3)

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
  const [pages, setPages] = useState(5)
  const [animation, setAnimation] = useState(3)
  const [likeThat, setLikeThat] = useState(false)
  const [uploadContent, setUploadContent] = useState(false)
  const [subscription, setSubscription] = useState(false)
  const [paymentUpfront, setPaymentUpfront] = useState(false)
  const [linkToUs, setLinkToUs] = useState(false)

  const baseDays = calculateStageDays(pages, animation)
  const [originalDays, setOriginalDays] = useState<StageDays>(baseDays)
  const [stageDays, setStageDays] = useState<StageDays>(baseDays)

  const updateDays = (newPages: number, newAnimation: number) => {
    const newOriginalDays = calculateStageDays(newPages, newAnimation)
    setOriginalDays(newOriginalDays)
    
    // Apply reductions
    let research = newOriginalDays.research
    if (likeThat) {
      research = Math.max(1, research - 1)
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
    setPages(value)
    updateDays(value, animation)
  }

  const handleAnimationChange = (value: number) => {
    setAnimation(value)
    updateDays(pages, value)
  }

  const handleLikeThatChange = (checked: boolean) => {
    setLikeThat(checked)
    const currentOriginal = calculateStageDays(pages, animation)
    setOriginalDays(currentOriginal)
    const newResearch = checked 
      ? Math.max(1, currentOriginal.research - 1)
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
  let totalCost = totalDays * DAY_RATE

  // Apply discounts
  if (subscription) {
    totalCost *= 0.9
  }
  if (paymentUpfront) {
    totalCost *= 0.9
  }
  if (linkToUs) {
    totalCost *= 0.95
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12 max-w-4xl mx-auto">
      <h1 className="text-5xl font-semibold mb-12 tracking-tighter">Website Cost Configurator</h1>
      
      <div className="space-y-12">
        {/* Sliders */}
        <div className="space-y-8">
          <Slider
            label="Number of Pages"
            value={pages}
            min={1}
            max={20}
            onChange={handlePagesChange}
          />
          <Slider
            label="Animation Complexity"
            value={animation}
            min={1}
            max={10}
            onChange={handleAnimationChange}
          />
        </div>

        {/* Stages Table */}
        <StagesTable 
          stageDays={stageDays} 
          originalDays={originalDays}
          likeThat={likeThat} 
          uploadContent={uploadContent} 
        />

        {/* Total Days */}
        <div className="text-2xl font-medium tracking-tighter">
          Total: {totalDays} days
        </div>

        {/* Day Rate */}
        <div className="text-xl opacity-60 tracking-tighter">
          Rate: ${DAY_RATE.toLocaleString()} per day
        </div>

        {/* Configurator */}
        <Configurator
          likeThat={likeThat}
          onLikeThatChange={handleLikeThatChange}
          uploadContent={uploadContent}
          onUploadContentChange={handleUploadContentChange}
          subscription={subscription}
          onSubscriptionChange={setSubscription}
          paymentUpfront={paymentUpfront}
          onPaymentUpfrontChange={setPaymentUpfront}
          linkToUs={linkToUs}
          onLinkToUsChange={setLinkToUs}
        />

        {/* Total Cost */}
        <div className="text-4xl font-semibold tracking-tighter pt-8 border-t border-white/10">
          Total Cost: ${Math.round(totalCost).toLocaleString()}
        </div>

        {/* Submit Button */}
        <SubmitButton />
      </div>
    </div>
  )
}

export default App
