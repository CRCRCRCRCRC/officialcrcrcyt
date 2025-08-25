import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { WebsiteAuthProvider } from '../contexts/WebsiteAuthContext'

const Layout = () => {
  return (
    <WebsiteAuthProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </WebsiteAuthProvider>
  )
}

export default Layout