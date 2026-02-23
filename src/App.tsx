import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import ConfiguratorPage from './pages/ConfiguratorPage'
import ConfiguratorConfigPage from './pages/ConfiguratorConfigPage'
import ProjectsPage from './pages/ProjectsPage'
import LikeThatPage from './pages/LikeThatPage'

const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID as string | undefined

/** Initialize Facebook Pixel when VITE_FB_PIXEL_ID is set in .env */
function useFacebookPixel() {
  useEffect(() => {
    if (!FB_PIXEL_ID || typeof window === 'undefined') return
    if ((window as unknown as { fbq?: unknown }).fbq) return
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://connect.facebook.net/en_US/fbevents.js'
    s.onload = () => {
      try {
        ;(window as unknown as { fbq: (a: string, b: string) => void }).fbq('init', FB_PIXEL_ID!)
        ;(window as unknown as { fbq: (a: string, b: string) => void }).fbq('track', 'PageView')
      } catch {
        // ignore
      }
    }
    document.head.appendChild(s)
  }, [])
}

/** Redirect from old paths to single URL with ?step=N (preserve query). */
function RedirectToStep({ step }: { step: number }) {
  const location = useLocation()
  const sp = new URLSearchParams(location.search)
  sp.set('step', String(step))
  if (step === 3 && location.pathname === '/increase') sp.set('v', '1')
  return <Navigate to={`/?${sp.toString()}`} replace />
}

function App() {
  useFacebookPixel()
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ConfiguratorPage />} />
          <Route path="config" element={<ConfiguratorConfigPage />} />
          <Route path="animation" element={<RedirectToStep step={2} />} />
          <Route path="reduce" element={<RedirectToStep step={3} />} />
          <Route path="increase" element={<RedirectToStep step={3} />} />
          <Route path="summary" element={<RedirectToStep step={4} />} />
          <Route path="request" element={<RedirectToStep step={4} />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="like-that" element={<LikeThatPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
