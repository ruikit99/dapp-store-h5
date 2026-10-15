import { useEffect, useState } from 'react'
import { Outlet, useLocation, useMatch } from 'react-router-dom'
import { setWalletRouteName } from '@/lib/walletCtx'
import { getRouteNameFromPath } from '@/lib/routeNames'
import Header from '@/components/Header'
import CartDrawer from '@/components/CartDrawer'
import AddToCartToast from '@/components/AddToCartToast'
import WalletGuard from '@/components/WalletGuard'
import ScrollRestoration from '@/components/ScrollRestoration'
import { useRestoreWalletLogin } from '@/hooks/useRestoreWalletLogin'

export default function AppShell() {
  const location = useLocation()
  const isHome = useMatch('/')
  const isDetails = useMatch('/details/:sku')
  const showCart = Boolean(isHome || isDetails)
  const [showBackTop, setShowBackTop] = useState(false)

  useRestoreWalletLogin()

  useEffect(() => {
    setWalletRouteName(getRouteNameFromPath(location.pathname))
  }, [location.pathname])

  useEffect(() => {
    setShowBackTop(false)
  }, [location.key])

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`layout-container${isDetails ? ' detail' : ''}`}>
      <ScrollRestoration />
      <Header />
      <main>
        <Outlet />
      </main>
      {showCart && <CartDrawer />}
      <AddToCartToast />
      <WalletGuard />
      {showBackTop && (
        <button
          type="button"
          id="back-to-top"
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        ><svg className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5852" width="48" height="48"><path d="M885.508793 520.938121 537.140192 173.069211c-13.759934-13.726144-36.05455-13.703616-49.804244 0.045054L138.537285 521.414261c-13.772222 13.759934-13.772222 35.986969-0.045054 49.713112 13.749695 13.726144 36.043286 13.726144 49.815508 0l289.257611-288.86134 0 544.075453c0 19.270871 15.635823 34.906694 34.907718 34.906694 19.283158 0 34.917957-15.635823 34.917957-34.906694l0-543.516372 288.280756 287.847622c13.748671 13.726144 36.043286 13.726144 49.791957 0C899.234936 556.901538 899.234936 534.675528 885.508793 520.938121z" fill="#6A66FF" p-id="5853"></path></svg></button>
      )}
    </div>
  )
}
