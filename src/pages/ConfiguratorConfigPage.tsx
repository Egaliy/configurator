import { useState } from 'react'

type Preset = '0' | '1'  // 0 = cheap, 1 = expensive
type Version = '0' | '1'  // 0 = reduce cost, 1 = increase

export default function ConfiguratorConfigPage() {
  const [preset, setPreset] = useState<Preset>('1')
  const [version, setVersion] = useState<Version>('0')

  const search = new URLSearchParams()
  search.set('step', '1')
  search.set('preset', preset)
  if (version === '1') search.set('v', '1')
  const configuratorUrl = `/?${search.toString()}`

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl md:text-3xl font-normal mb-2 tracking-tighter">
          Configurator format
        </h1>
        <p className="text-sm opacity-60 tracking-tighter mb-10">
          Choose default buttons and step 3 variant. Then open the configurator with the link.
        </p>

        <div className="space-y-8">
          <div>
            <div className="text-sm font-medium opacity-80 mb-3 tracking-tighter">
              Default selection (step 1–2)
            </div>
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              <button
                type="button"
                onClick={() => setPreset('0')}
                className={`flex-1 py-4 px-4 text-center text-sm tracking-tighter transition-colors ${
                  preset === '0'
                    ? 'bg-white text-black'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                Cheap (Promo + Basic)
              </button>
              <button
                type="button"
                onClick={() => setPreset('1')}
                className={`flex-1 py-4 px-4 text-center text-sm tracking-tighter transition-colors ${
                  preset === '1'
                    ? 'bg-white text-black'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                Expensive (Enterprise + Immersive)
              </button>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium opacity-80 mb-3 tracking-tighter">
              Step 3 variant
            </div>
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              <button
                type="button"
                onClick={() => setVersion('0')}
                className={`flex-1 py-4 px-4 text-center text-sm tracking-tighter transition-colors ${
                  version === '0'
                    ? 'bg-white text-black'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                Reduce cost
              </button>
              <button
                type="button"
                onClick={() => setVersion('1')}
                className={`flex-1 py-4 px-4 text-center text-sm tracking-tighter transition-colors ${
                  version === '1'
                    ? 'bg-white text-black'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                Increase value
              </button>
            </div>
          </div>

          <div className="pt-4">
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
