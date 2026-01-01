import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { WebsiteAuthProvider } from '../contexts/WebsiteAuthContext'
import { CoinProvider } from '../contexts/CoinContext'

const Layout = () => {
  return (
    <WebsiteAuthProvider>
      <CoinProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 main-shell flex flex-col">
            <Outlet />
          </main>
          <Footer />
        </div>
      </CoinProvider>
    </WebsiteAuthProvider>
  )
}

export default Layout
