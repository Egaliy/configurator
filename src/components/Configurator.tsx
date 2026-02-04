interface ConfiguratorProps {
  likeThat: boolean
  onLikeThatChange: (checked: boolean) => void
  uploadContent: boolean
  onUploadContentChange: (checked: boolean) => void
  subscription: boolean
  onSubscriptionChange: (checked: boolean) => void
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
  paymentUpfront,
  onPaymentUpfrontChange,
  linkToUs,
  onLinkToUsChange,
}: ConfiguratorProps) {
  return (
    <div className="space-y-6 pt-8 border-t border-white/10">
      <h2 className="text-3xl font-semibold tracking-tighter mb-8">Configuration</h2>

      {/* Like That Option */}
      <label className="flex items-start gap-4 cursor-pointer group">
        <input
          type="checkbox"
          checked={likeThat}
          onChange={(e) => onLikeThatChange(e.target.checked)}
          className="mt-1 w-5 h-5 accent-white cursor-pointer"
        />
        <div className="flex-1">
          <div className="text-lg font-medium tracking-tighter">Like That</div>
          <div className="text-base opacity-60 mt-1 tracking-tighter">
            Debug references yourself in the app — minus 1 day on Research
          </div>
        </div>
      </label>

      {/* Upload Content Option */}
      <label className="flex items-start gap-4 cursor-pointer group">
        <input
          type="checkbox"
          checked={uploadContent}
          onChange={(e) => onUploadContentChange(e.target.checked)}
          className="mt-1 w-5 h-5 accent-white cursor-pointer"
        />
        <div className="flex-1">
          <div className="text-lg font-medium tracking-tighter">Upload all content to Figma yourself</div>
          <div className="text-base opacity-60 mt-1 tracking-tighter">
            Minus 1 day on Wireframes
          </div>
        </div>
      </label>

      {/* Subscription Option */}
      <div className="border border-white/10 rounded-lg p-6">
        <label className="flex items-start gap-4 cursor-pointer group">
          <input
            type="checkbox"
            checked={subscription}
            onChange={(e) => onSubscriptionChange(e.target.checked)}
            className="mt-1 w-5 h-5 accent-white cursor-pointer"
          />
          <div className="flex-1">
            <div className="text-lg font-medium tracking-tighter">Buy subscription</div>
            <div className="text-base opacity-60 mt-1 tracking-tighter mb-4">
              Minus 10% of total cost
            </div>
            <button
              type="button"
              onClick={() => onSubscriptionChange(true)}
              className="px-8 py-4 bg-white text-black text-lg font-medium rounded-lg hover:opacity-90 transition-opacity tracking-tighter"
            >
              Buy Subscription
            </button>
            <div className="text-sm opacity-50 mt-4 tracking-tighter">
              Continuous autonomous text and work on your website. Conducting marketing A/B tests. 
              Continuous improvement of all metrics without your participation — $500/month
            </div>
          </div>
        </label>
      </div>

      {/* Payment Options */}
      <div className="space-y-4">
        <label className="flex items-center gap-4 cursor-pointer group">
          <input
            type="radio"
            name="payment"
            checked={paymentUpfront}
            onChange={() => onPaymentUpfrontChange(true)}
            className="w-5 h-5 accent-white cursor-pointer"
          />
          <div>
            <div className="text-lg font-medium tracking-tighter">Pay upfront</div>
            <div className="text-base opacity-60 mt-1 tracking-tighter">
              Minus 10% of total cost
            </div>
          </div>
        </label>

        <label className="flex items-center gap-4 cursor-pointer group">
          <input
            type="radio"
            name="payment"
            checked={!paymentUpfront}
            onChange={() => onPaymentUpfrontChange(false)}
            className="w-5 h-5 accent-white cursor-pointer"
          />
          <div>
            <div className="text-lg font-medium tracking-tighter">Pay in installments</div>
            <div className="text-base opacity-60 mt-1 tracking-tighter">
              Total amount unchanged
            </div>
          </div>
        </label>
      </div>

      {/* Link to Us Toggle */}
      <label className="flex items-center gap-4 cursor-pointer group">
        <input
          type="checkbox"
          checked={linkToUs}
          onChange={(e) => onLinkToUsChange(e.target.checked)}
          className="w-5 h-5 accent-white cursor-pointer"
        />
        <div>
          <div className="text-lg font-medium tracking-tighter">Link to us in the footer</div>
          <div className="text-base opacity-60 mt-1 tracking-tighter">
            Minus 5% of total cost
          </div>
        </div>
      </label>
    </div>
  )
}
