import { setStored } from '@/lib/browserStorage'
import { useWalletStore } from '@/stores/wallet'
import { useSessionStore } from '@/stores/session'

type NavigateFn = (to: string) => void

let navigateFn: NavigateFn | null = null
let redirectingHome = false

export function setForceLogoutNavigate(fn: NavigateFn) {
  navigateFn = fn
}

export function forceLogout(options?: { redirectHome?: boolean }) {
  useWalletStore.getState().setWallet(null)
  useWalletStore.getState().setIsConnect(false)
  setStored('connect', 'false')
  sessionStorage.setItem('isConnect', 'false')
  useSessionStore.getState().clearSession()

  if (!options?.redirectHome) return
  if (redirectingHome) return

  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  if (pathname === '/' || pathname === '') return

  redirectingHome = true
  try {
    if (navigateFn) {
      navigateFn('/')
    } else {
      window.location.href = '/'
    }
  } finally {
    window.setTimeout(() => {
      redirectingHome = false
    }, 1500)
  }
}
