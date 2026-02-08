interface ConfiguratorProps {
  likeThat: boolean
  onLikeThatChange: (checked: boolean) => void
  uploadContent: boolean
  onUploadContentChange: (checked: boolean) => void
  subscription: boolean
  onSubscriptionChange: (checked: boolean) => void
  subscriptionLoading: boolean
  onSubscriptionLoadingChange: (loading: boolean) => void
  paymentUpfront: boolean
  onPaymentUpfrontChange: (checked: boolean) => void
  linkToUs: boolean
  onLinkToUsChange: (checked: boolean) => void
}

export default function Configurator({
  likeThat,
  onLikeThatChange,
  uploadContent,
  onUploadContentChange,
  subscription,
  onSubscriptionChange,
  subscriptionLoading,
  onSubscriptionLoadingChange,
  paymentUpfront,
  onPaymentUpfrontChange,
  linkToUs,
  onLinkToUsChange,
}: ConfiguratorProps) {
  const handleBuySubscription = () => {
    if (subscriptionLoading || subscription) return
    
    onSubscriptionLoadingChange(true)
    
    setTimeout(() => {
      onSubscriptionLoadingChange(false)
      onSubscriptionChange(true)
    }, 5000)
  }
  return (
    <div className="space-y-6 pt-8 border-t border-white/10">
      <h2 className="text-2xl md:text-3xl font-normal heading-large mb-8">Reduce Cost</h2>

      {/* Like That Option */}
      <label className="flex items-start gap-4 cursor-pointer group">
        <input
          type="checkbox"
          checked={likeThat}
          onChange={(e) => onLikeThatChange(e.target.checked)}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="text-base md:text-lg font-medium tracking-tighter">
            Conduct research yourself −1 day on Research
          </div>
          <div className="text-sm md:text-base opacity-60 mt-1 tracking-tighter">
            You will need to like 100 design references in the Like That app so we understand what design you need
          </div>
        </div>
      </label>

      {/* Upload Content Option */}
      <label className="flex items-start gap-4 cursor-pointer group">
          <input
            type="checkbox"
            checked={uploadContent}
            onChange={(e) => onUploadContentChange(e.target.checked)}
            className="mt-1"
          />
        <div className="flex-1">
          <div className="text-base md:text-lg font-medium tracking-tighter">
            Upload all content to Figma yourself −1 day on Wireframes
          </div>
          <div className="text-sm md:text-base opacity-60 mt-1 tracking-tighter">
            You will need to prepare and upload all text, images, and other content to Figma files yourself
          </div>
        </div>
      </label>

      {/* Subscription Option */}
      <div className="border border-white/10 rounded-lg p-8">
        <div className="space-y-6">
            <div className="text-base md:text-lg font-medium tracking-tighter">
              Subscription for website improvement from ubernatural.io −10%
            </div>
            <button
              type="button"
              onClick={handleBuySubscription}
              disabled={subscriptionLoading || subscription}
              className="px-6 md:px-8 py-3 md:py-4 bg-white text-black text-base font-medium rounded-lg hover:opacity-90 transition-opacity tracking-tighter disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3"
            >
            {subscriptionLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : subscription ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span>Subscribed</span>
              </>
            ) : (
              'Buy Subscription'
            )}
          </button>
          <div className="text-xs md:text-sm opacity-50 tracking-tighter">
            Continuous autonomous text and work on your website. Conducting marketing A/B tests. 
            Continuous improvement of all metrics without your participation — $500/month
          </div>
        </div>
      </div>

      {/* Link to Us Toggle */}
      <label className="flex items-center gap-4 cursor-pointer group">
        <input
          type="checkbox"
          checked={linkToUs}
          onChange={(e) => onLinkToUsChange(e.target.checked)}
        />
        <div>
          <div className="text-base md:text-lg font-medium tracking-tighter">Link to us in the footer</div>
          <div className="text-sm md:text-base opacity-60 mt-1 tracking-tighter">
            −5% of total cost
          </div>
        </div>
      </label>

      {/* Payment Options */}
      <div className="flex items-center gap-4 justify-start">
        <button
          type="button"
          onClick={() => onPaymentUpfrontChange(false)}
          className={`text-base font-medium tracking-tighter transition-opacity text-left flex items-center gap-3 ${
            !paymentUpfront ? 'opacity-100' : 'opacity-40'
          }`}
        >
          <img 
            src="/imgs/parts.svg" 
            alt="Installments" 
            className={`h-5 md:h-6 transition-opacity ${!paymentUpfront ? 'opacity-100' : 'opacity-40'}`}
          />
          <div>
            <div>Pay in installments</div>
            <div className="text-sm md:text-base opacity-60 font-normal">Total amount unchanged</div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onPaymentUpfrontChange(!paymentUpfront)}
          className="relative w-14 h-7 bg-white/10 rounded-full p-1 transition-colors flex-shrink-0"
        >
          <div
            className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
              paymentUpfront ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
        <button
          type="button"
          onClick={() => onPaymentUpfrontChange(true)}
          className={`text-base font-medium tracking-tighter transition-opacity text-left flex items-center gap-3 ${
            paymentUpfront ? 'opacity-100' : 'opacity-40'
          }`}
        >
          <img 
            src="/imgs/full.svg" 
            alt="Full payment" 
            className={`h-5 md:h-6 transition-opacity ${paymentUpfront ? 'opacity-100' : 'opacity-40'}`}
          />
          <div>
            <div>Pay upfront</div>
            <div className="text-sm md:text-base opacity-60 font-normal">−10% of total cost</div>
          </div>
        </button>
      </div>
    </div>
  )
}
