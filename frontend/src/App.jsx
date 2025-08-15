import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Home from './pages/Home'
import VideoDetail from './pages/VideoDetail'
import About from './pages/About'
import Announcements from './pages/Announcements'
import AnnouncementDetail from './pages/AnnouncementDetail'

import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'

import AdminChannel from './pages/admin/Channel'
import AdminAnnouncements from './pages/admin/Announcements'
import AdminSettings from './pages/admin/Settings'
import ProtectedRoute from './components/ProtectedRoute'
import NotFound from './pages/NotFound'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* 公開頁面 */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="videos/:id" element={<VideoDetail />} />
          <Route path="about" element={<About />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="announcements/:slug" element={<AnnouncementDetail />} />

        </Route>

        {/* 管理員登入頁面 */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* 管理員後台 */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />

          <Route path="channel" element={<AdminChannel />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* 404 頁面 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}

export default App