import { create } from 'zustand'
import { getStored, setStored, removeStored } from '@/lib/browserStorage'

interface SessionState {
  sessionId: string
  setSessionId: (v: string) => void
  persistSessionId: (v: string) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: '',
  setSessionId: (v) => set({ sessionId: v }),
  persistSessionId: (v) => {
    set({ sessionId: v })
    // 登录流程已按服务端 expire_time 写入，值相同时不再用默认 1 天覆盖
    if (getStored('session_id') !== v) {
      setStored('session_id', v, { expires: 1 })
    }
  },
  clearSession: () => {
    set({ sessionId: '' })
    removeStored('session_id')
    sessionStorage.removeItem('session_id')
  },
}))

export type AddToCartToastPayload = {
  name: string
  price?: string | number
  image?: string
  qty: number
  sku?: string
}

interface UiState {
  cartVisible: boolean
  setCartVisible: (v: boolean) => void
  showBackTop: boolean
  setShowBackTop: (v: boolean) => void
  signInVisible: boolean
  signInCallback: (() => void) | null
  setSignInVisible: (v: boolean, cb?: () => void) => void
  dismissSignIn: () => void
  completeSignInSuccess: () => void
  addToCartToast: AddToCartToastPayload | null
  showAddToCartToast: (payload: AddToCartToastPayload) => void
  hideAddToCartToast: () => void
}

export const useUiStore = create<UiState>((set, get) => ({
  cartVisible: false,
  setCartVisible: (v) => set({ cartVisible: v }),
  showBackTop: false,
  setShowBackTop: (v) => set({ showBackTop: v }),
  signInVisible: false,
  signInCallback: null,
  setSignInVisible: (v, cb) => {
    if (v) {
      set((state) => ({
        signInVisible: true,
        signInCallback: cb !== undefined ? (cb ?? null) : state.signInCallback,
      }))
    } else {
      set({ signInVisible: false })
    }
  },
  dismissSignIn: () => set({ signInVisible: false, signInCallback: null }),
  completeSignInSuccess: () => {
    const cb = get().signInCallback
    set({ signInVisible: false, signInCallback: null })
    cb?.()
  },
  addToCartToast: null,
  showAddToCartToast: (payload) => set({ addToCartToast: payload }),
  hideAddToCartToast: () => set({ addToCartToast: null }),
}))

export function resolveSessionId(): string {
  const { sessionId } = useSessionStore.getState()
  return getStored('session_id') || sessionId || ''
}
