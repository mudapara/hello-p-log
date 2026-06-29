import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { TopPage } from './pages/TopPage'
import { HomePage } from './pages/HomePage'
import { MapPage } from './pages/MapPage'
import { NewLogPage } from './pages/NewLogPage'
import { EditLogPage } from './pages/EditLogPage'
import { MyLogsPage } from './pages/MyLogsPage'
import { LoginPage } from './pages/LoginPage'
import { RankingPage } from './pages/RankingPage'
import { ArPage } from './pages/ArPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { AdminPage } from './pages/AdminPage'
import { SiteAnalytics } from './components/SiteAnalytics'

export default function App() {
  return (
    <BrowserRouter>
      <SiteAnalytics />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TopPage />} />
          <Route path="/photo" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/log/new" element={<NewLogPage />} />
          <Route path="/log/edit/:id" element={<EditLogPage />} />
          <Route path="/my-logs" element={<MyLogsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/ar" element={<ArPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
