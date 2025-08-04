import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Videos from './pages/Videos'
import VideoDetail from './pages/VideoDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminVideos from './pages/admin/AdminVideos'
import AdminChannel from './pages/admin/AdminChannel'
import AdminSettings from './pages/admin/AdminSettings'
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
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/videos" element={
          <ProtectedRoute>
            <AdminVideos />
          </ProtectedRoute>
        } />
        <Route path="/admin/channel" element={
          <ProtectedRoute>
            <AdminChannel />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute>
            <AdminSettings />
          </ProtectedRoute>
        } />

        {/* 404 頁面 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}

export default App