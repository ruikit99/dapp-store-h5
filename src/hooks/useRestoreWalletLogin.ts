import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { onConnect } from '@/lib/connectWallet.js'
import { getStored } from '@/lib/browserStorage'
import { forceLogout } from '@/lib/forceLogout'
import { useWalletStore } from '@/stores/wallet'
import { useUiStore, resolveSessionId } from '@/stores/session'
import { showToast } from '@/lib/tips'

export function notifyWalletConnectError(error: any, sameRequestText: string) {
  const { message, code } = error || {}
  if (code === 4001) return
  if (code === -32002) {
    showToast(sameRequestText)
    return
  }
  if (code === -9000 && message) {
    showToast(message)
    return
  }
  if (message) showToast(message)
}

function persistedWalletAddress() {
  return getStored('wallet-address') || ''
}

function dropStaleSession() {
  forceLogout()
}

export function shouldAutoRestoreWallet() {
  return getStored('connect') === 'true'
}

export function useRestoreWalletLogin() {
  const { t } = useTranslation()
  const [providerReady, setProviderReady] = useState(false)
  const restoringRef = useRef(false)
  const sameRequestText = t('home.have_initiated_same_request')

  useEffect(() => {
    let stopped = false

    const detect = () => {
      if (stopped) return true
      try {
        if (window.ethereum) {
          window.ethereum
            .request({ method: 'eth_requestAccounts' })
            .then((accounts: string[]) => {
              if (stopped) return
              const saved = persistedWalletAddress()
              if (accounts?.[0] && saved && accounts[0] !== saved) {
                dropStaleSession()
              }
              setProviderReady(true)
            })
            .catch(() => {
              stopped = true
            })
          return true
        }
        if (window.solana) {
          const address = window.solana.address
          const saved = getStored('wallet-address') || ''
          if (address && saved && address !== saved) {
            dropStaleSession()
          }
          setProviderReady(true)
          return true
        }
        if (window.tronWeb) {
          const base58 = window.tronWeb?.defaultAddress?.base58
          const ready = window.tronWeb?.ready
          const saved = getStored('wallet-address') || ''
          if (base58 && saved && base58 !== saved) {
            dropStaleSession()
          }
          setProviderReady(Boolean(ready) || Boolean(base58))
          return true
        }
      } catch {
        return true
      }
      return false
    }

    if (detect()) {
      return () => {
        stopped = true
      }
    }

    const timer = window.setInterval(() => {
      if (detect()) window.clearInterval(timer)
    }, 200)

    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!providerReady || restoringRef.current) return
    if (!shouldAutoRestoreWallet()) return

    const sessionId = resolveSessionId()
    if (!sessionId) {
      if (!useUiStore.getState().signInVisible) {
        useUiStore.getState().setSignInVisible(true)
      }
      return
    }

    restoringRef.current = true
    onConnect()
      .then((res: any) => {
        if (!res) return
        useWalletStore.getState().setWallet(res)
        useWalletStore.getState().setIsConnect(!!res.isConnected)
        if (res.currentAccount) {
          useWalletStore.getState().setWalletAddress(res.currentAccount)
        }
        useUiStore.getState().setSignInVisible(false)
      })
      .catch((error: any) => {
        restoringRef.current = false
        notifyWalletConnectError(error, sameRequestText)
      })
  }, [providerReady, sameRequestText])
}
