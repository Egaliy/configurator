import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import ConfiguratorPage from './pages/ConfiguratorPage'
import ConfiguratorConfigPage from './pages/ConfiguratorConfigPage'
import ProjectsPage from './pages/ProjectsPage'
import LikeThatPage from './pages/LikeThatPage'

/** Редирект со старых путей на один адрес с ?step=N (сохраняем query). */
function RedirectToStep({ step }: { step: number }) {
  const location = useLocation()
  const sp = new URLSearchParams(location.search)
  sp.set('step', String(step))
  if (step === 3 && location.pathname === '/increase') sp.set('v', '1')
  return <Navigate to={`/?${sp.toString()}`} replace />
}

function App() {
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
