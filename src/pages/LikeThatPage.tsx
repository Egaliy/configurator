/**
 * Like That — swipe-based reference review.
 * Renders the Like That app in an iframe when available (same origin at /like-that-app/ or VITE_LIKE_THAT_URL).
 * Otherwise shows a placeholder with design system styling.
 */
const IFRAME_BASE = import.meta.env.VITE_LIKE_THAT_URL ?? '/like-that-app/'

export default function LikeThatPage() {
  const iframeSrc = IFRAME_BASE.replace(/\/?$/, '/')

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1 flex flex-col min-h-0 relative">
        <iframe
          title="Like That"
          src={iframeSrc}
          className="w-full flex-1 min-h-0 border-0"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
        {/* Fallback when iframe fails to load (e.g. 404) — we show nothing; for explicit fallback we could use onError */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black pointer-events-none aria-hidden"
          id="like-that-fallback"
          style={{ display: 'none' }}
        >
          <div className="rounded-lg border border-white/10 bg-white/5 p-8 max-w-md text-center">
            <h1 className="text-2xl md:text-3xl font-normal heading-large tracking-tighter mb-2">
              Like That
            </h1>
            <p className="text-sm text-white/60 tracking-tighter mb-4">
              Swipe-based reference review. Run the Like That app and serve it at <code className="text-white/80">/like-that-app/</code> or set <code className="text-white/80">VITE_LIKE_THAT_URL</code>.
            </p>
            <a
              href={iframeSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 rounded-lg bg-white text-black text-base tracking-tighter hover:opacity-90 transition-opacity pointer-events-auto"
            >
              Open in new tab
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
