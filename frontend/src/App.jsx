import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Home from './pages/Home'
import VideoDetail from './pages/VideoDetail'
// import About from './pages/About'
import Announcements from './pages/Announcements'
import AnnouncementDetail from './pages/AnnouncementDetail'
import Wallet from './pages/Wallet'
import Shop from './pages/Shop'
import Backpack from './pages/Backpack'
import Leaderboard from './pages/Leaderboard'
import Tasks from './pages/Tasks'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import DiscordCallback from './pages/DiscordCallback'
import RedeemCode from './pages/RedeemCode'
import CategoryPage from './pages/lyrics/CategoryPage'
import ArtistsPage from './pages/lyrics/ArtistsPage'
import SongsPage from './pages/lyrics/SongsPage'
import LyricDetailPage from './pages/lyrics/LyricDetailPage'

import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'

import AdminAnnouncements from './pages/admin/Announcements'
import AdminSettings from './pages/admin/Settings'
import AdminAddCoins from './pages/admin/AddCoins'
import AdminAddXP from './pages/admin/AddXP'
import AdminDiscordApplications from './pages/admin/DiscordApplications'
import AdminLyrics from './pages/admin/Lyrics'
import AdminArtists from './pages/admin/Artists'
import AdminRedeemCodes from './pages/admin/RedeemCodes'
import ProtectedRoute from './components/ProtectedRoute'
import NotFound from './pages/NotFound'

function App() {
  return (
    <ErrorBoundary>
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
            <Route path="backpack" element={<Backpack />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="redeem" element={<RedeemCode />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/discord/callback" element={<DiscordCallback />} />

            {/* 歌詞階層式路由 */}
            <Route path="lyrics" element={<CategoryPage />} />
            <Route path="lyrics/:category" element={<ArtistsPage />} />
            <Route path="lyrics/:category/:artistSlug" element={<SongsPage />} />
            <Route path="lyrics/:category/:artistSlug/:songSlug" element={<LyricDetailPage />} />

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
            <Route path="add-xp" element={<AdminAddXP />} />
            <Route path="discord-applications" element={<AdminDiscordApplications />} />
            <Route path="redeem-codes" element={<AdminRedeemCodes />} />
            <Route path="artists" element={<AdminArtists />} />
            <Route path="lyrics" element={<AdminLyrics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* 404 頁面 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
