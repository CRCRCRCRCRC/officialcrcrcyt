import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* 全頁柔和底色（極淡漸層，絲滑不突兀） */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 via-purple-600/5 to-pink-600/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.6),transparent_60%)]" />
      </div>

      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout