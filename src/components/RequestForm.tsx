import { useEffect, useState, useCallback } from 'react'

interface RequestFormProps {
  isOpen: boolean
  onClose: () => void
  totalCost: number
  totalDays: number
}

export default function RequestForm({ isOpen, onClose, totalCost, totalDays }: RequestFormProps) {
  const [isClosing, setIsClosing] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      setIsSubmitted(false)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    if (isClosing) return // Предотвращаем множественные вызовы
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 300)
  }, [isClosing, onClose])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, isClosing, handleClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted')
    setIsSubmitted(true)
    
    // Автоматически закрыть попап через 3 секунды
    setTimeout(() => {
      handleClose()
    }, 3000)
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isOpen && !isClosing) return null

  return (
    <div 
      onClick={handleOverlayClick}
      className={`fixed inset-0 bg-black/70 backdrop-blur-[20px] z-50 flex items-center justify-center p-4 md:p-8 transition-opacity duration-300 ${isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="bg-transparent rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-normal heading-large">Leave a request</h2>
            <button
              onClick={handleClose}
              className="text-white/60 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>

          {isSubmitted ? (
            <div className="text-center py-12">
              <div className="mb-6">
                <svg className="w-16 h-16 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-normal heading-large mb-4">Thank you!</h3>
              <p className="text-base md:text-lg opacity-60 tracking-tighter mb-8">
                Your request has been sent successfully. We will contact you soon.
              </p>
              <button
                onClick={handleClose}
                className="px-8 py-3 bg-white text-black rounded-lg hover:opacity-90 transition-opacity tracking-tighter text-base"
                style={{
                  fontFamily: '"Almarena Neue Regular", "Almarena Neue Regular Placeholder", sans-serif',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-white/5 rounded-lg">
                <div className="text-sm opacity-60 mb-2">Project estimate</div>
                <div className="text-xl font-normal price-large">
                  {totalDays} days · ${Math.round(totalCost).toLocaleString()}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-transparent border border-white/10 hover:border-white/20 rounded-lg text-white focus:outline-none focus:border-white transition-colors tracking-tighter"
                  placeholder="Your name"
                />

                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-transparent border border-white/10 hover:border-white/20 rounded-lg text-white focus:outline-none focus:border-white transition-colors tracking-tighter"
                  placeholder="your@email.com"
                />

                <input
                  type="tel"
                  className="w-full px-4 py-3 bg-transparent border border-white/10 hover:border-white/20 rounded-lg text-white focus:outline-none focus:border-white transition-colors tracking-tighter"
                  placeholder="+1 (555) 000-0000"
                />

                <textarea
                  rows={4}
                  className="w-full px-4 py-3 bg-transparent border border-white/10 hover:border-white/20 rounded-lg text-white focus:outline-none focus:border-white transition-colors tracking-tighter resize-none"
                  placeholder="Tell us about your project..."
                />

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 border border-white/10 rounded-lg hover:border-white transition-colors tracking-tighter text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:opacity-90 transition-opacity tracking-tighter text-base"
                    style={{
                      fontFamily: '"Almarena Neue Regular", "Almarena Neue Regular Placeholder", sans-serif',
                      fontWeight: 400,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Send request
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
