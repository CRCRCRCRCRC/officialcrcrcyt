import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { WebsiteAuthProvider } from '../contexts/WebsiteAuthContext'
import { CoinProvider } from '../contexts/CoinContext'
import HumanGate from './HumanGate'

const Gate = ({ children }) => {
  const ok = (() => {
    try {
      const token = localStorage.getItem('human_token')
      const exp = Number(localStorage.getItem('human_exp') || 0)
      if (!token) return false
      if (exp && Date.now() > exp) return false
      return true
    } catch {
      return false
    }
  })()

  if (!ok) {
    return <HumanGate onPassed={() => window.location.reload()} />
  }
  return children
}

const Layout = () => {
  return (
    <WebsiteAuthProvider>
      <CoinProvider>
        <Gate>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
        </Gate>
      </CoinProvider>
    </WebsiteAuthProvider>
  )
}

export default Layout
