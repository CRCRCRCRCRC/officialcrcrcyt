import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Home from './pages/Home'
import VideoDetail from './pages/VideoDetail'
// import About from './pages/About'
import Announcements from './pages/Announcements'
import AnnouncementDetail from './pages/AnnouncementDetail'
import Wallet from './pages/Wallet'
import Shop from './pages/Shop'
import Pass from './pages/Pass'
import Leaderboard from './pages/Leaderboard'

import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'

import AdminAnnouncements from './pages/admin/Announcements'
import AdminSettings from './pages/admin/Settings'
import AdminAddCoins from './pages/admin/AddCoins'
import AdminDiscordApplications from './pages/admin/DiscordApplications'
import AdminFeaturedVideos from './pages/admin/FeaturedVideos'
import AdminVideos from './pages/admin/Videos'
import AdminVideoForm from './pages/admin/VideoForm'
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
          {/* 關於頁面已移除 */}
          {/* <Route path="about" element={<About />} /> */}
          <Route path="announcements" element={<Announcements />} />
          <Route path="announcements/:slug" element={<AnnouncementDetail />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="shop" element={<Shop />} />
          <Route path="pass" element={<Pass />} />
          <Route path="leaderboard" element={<Leaderboard />} />

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

          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="add-coins" element={<AdminAddCoins />} />
          <Route path="discord-applications" element={<AdminDiscordApplications />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="featured-videos" element={<AdminFeaturedVideos />} />
          <Route path="videos" element={<AdminVideos />} />
          <Route path="videos/create" element={<AdminVideoForm />} />
          <Route path="videos/edit/:id" element={<AdminVideoForm />} />
        </Route>

        {/* 404 頁面 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
