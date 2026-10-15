import { getStored, setStored, removeStored } from '@/lib/browserStorage'
import { useCartStore, hydrateCartCredentialsFromSession } from '@/stores/cart'
import { useSessionStore } from '@/stores/session'
import { useWalletStore } from '@/stores/wallet'
import { setRefreshSessionHandler, setRecoverInvalidCartHandler } from '@/api/http'
import { onConnect } from '@/lib/connectWallet.js'

export async function bootstrapApp(_routeName?: string | null) {
  const session = useSessionStore.getState()
  const cart = useCartStore.getState()

  setRecoverInvalidCartHandler(() => useCartStore.getState().resetCart())

  const cartID = getStored('cartId') || ''

  if (!cart.cartId && !cartID) {
    await cart.getCartID()
  } else if (cartID) {
    cart.setCartID(cartID)
  }

  hydrateCartCredentialsFromSession()

  const sid = getStored('session_id') || ''
  if (sid) {
    session.setSessionId(sid)
  }

  const connect = getStored('connect')
  if (connect === 'true') {
    useWalletStore.getState().setIsConnect(true)
  }

  setRefreshSessionHandler(async (param) => {
    removeStored('session_id')
    session.clearSession()
    try {
      const res = await onConnect()
      if (!res) return
      const { isConnected } = res
      setStored('connect', String(!!isConnected))
      useWalletStore.getState().setWallet(res)
      useWalletStore.getState().setIsConnect(!!isConnected)
      return { refreshSessinId: true, ...param }
    } catch (error: any) {
      window.location.href = '/'
      throw { ...error, refreshSessinId: true }
    }
  })
}
