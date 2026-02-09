import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ConfiguratorPage from './pages/ConfiguratorPage'
import ProjectsPage from './pages/ProjectsPage'
import LikeThatPage from './pages/LikeThatPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ConfiguratorPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="like-that" element={<LikeThatPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
