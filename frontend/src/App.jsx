import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Home from './pages/Home'
import Videos from './pages/Videos'
import VideoDetail from './pages/VideoDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminVideos from './pages/admin/Videos'
import AdminChannel from './pages/admin/Channel'
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
          <Route path="videos" element={<Videos />} />
          <Route path="videos/:id" element={<VideoDetail />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
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
          <Route path="videos" element={<AdminVideos />} />
          <Route path="channel" element={<AdminChannel />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* 404 頁面 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}

export default App