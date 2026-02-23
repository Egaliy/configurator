import { useState, useEffect } from 'react'

const STORAGE_KEY = 'configurator_unlocked'
const PASSWORD = (import.meta.env.VITE_UNLOCK_PASSWORD as string)?.trim()

export default function UnlockGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null)

  useEffect(() => {
    if (!PASSWORD) {
      setUnlocked(true)
      return
    }
    try {
      setUnlocked(sessionStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      setUnlocked(false)
    }
  }, [])

  const handleUnlock = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('password') as HTMLInputElement
    const value = input?.value?.trim() ?? ''
    if (value === PASSWORD) {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1')
      } catch {
        // ignore
      }
      setUnlocked(true)
    } else {
      setError(true)
    }
  }

  const [error, setError] = useState(false)

  if (PASSWORD && unlocked === false) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-4">
          <label className="block">
            <span className="block text-sm opacity-70 mb-2 tracking-tighter">Password</span>
            <input
              type="password"
              name="password"
              autoFocus
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white tracking-tighter"
              placeholder="Enter password"
            />
          </label>
          {error && (
            <p className="text-sm text-red-400 tracking-tighter">Wrong password</p>
          )}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-white text-black font-medium rounded-lg hover:bg-neutral-100 transition-colors tracking-tighter"
          >
            Enter
          </button>
        </form>
      </div>
    )
  }

  if (unlocked === null) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <span className="opacity-50 tracking-tighter">Loading...</span>
      </div>
    )
  }

  return (
    <>
      {children}
      {PASSWORD && (
        <button
          type="button"
          onClick={() => {
            try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
            window.location.reload()
          }}
          className="fixed bottom-4 right-4 text-xs opacity-50 hover:opacity-80 tracking-tighter"
        >
          Lock
        </button>
      )}
    </>
  )
}
