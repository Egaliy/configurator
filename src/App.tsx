import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import ConfiguratorPage from './pages/ConfiguratorPage'
import ConfiguratorConfigPage from './pages/ConfiguratorConfigPage'
import ProjectsPage from './pages/ProjectsPage'
import LikeThatPage from './pages/LikeThatPage'
import {
  defaultConfig,
  DEFAULT_UI_PREFS,
  saveConfiguratorLaunch,
  setInitialStepSession,
  type ConfiguratorUiPrefs,
} from './configuratorConfig'

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

/** Redirect legacy paths to / (step and UI prefs via sessionStorage, no URL params). */
function RedirectToStep({ step, ui }: { step: number; ui?: Partial<ConfiguratorUiPrefs> }) {
  const location = useLocation()
  if (typeof window !== 'undefined') {
    setInitialStepSession(step)
    if (ui) {
      saveConfiguratorLaunch(defaultConfig, { ...DEFAULT_UI_PREFS, ...ui })
    } else if (location.pathname === '/increase') {
      saveConfiguratorLaunch(defaultConfig, { ...DEFAULT_UI_PREFS, step3Version: 'increase' })
    } else if (location.pathname === '/reduce') {
      saveConfiguratorLaunch(defaultConfig, { ...DEFAULT_UI_PREFS, step3Version: 'reduce' })
    }
  }
  return <Navigate to="/" replace />
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
          <Route path="reduce" element={<RedirectToStep step={3} ui={{ step3Version: 'reduce' }} />} />
          <Route path="increase" element={<RedirectToStep step={3} ui={{ step3Version: 'increase' }} />} />
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
