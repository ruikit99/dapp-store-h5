import { create } from 'zustand'
import { getStored, setStored, removeStored } from '@/lib/browserStorage'
import { api } from '@/api'

export interface CartItem {
  item_id: string | number
  sku: string
  name: string
  qty: number
  price: number | string
  disableminus?: boolean
  [key: string]: any
}

interface CartState {
  cartId: string | null
  carts: CartItem[]
  cartsTotal: Record<string, any>
  coupon: string
  setCartID: (id: string | null) => void
  setCarts: (items: CartItem[]) => void
  setCartsTotal: (total: Record<string, any>) => void
  setCoupon: (v: string) => void
  setCouponValue: (v: string) => void
  getCartID: () => Promise<string>
  getCartsList: () => Promise<CartItem[]>
  cartsTotals: () => Promise<Record<string, any>>
  resetCart: () => Promise<string>
}

export const useCartStore = create<CartState>((set, get) => ({
  cartId: null,
  carts: [],
  cartsTotal: {},
  coupon: '',
  setCartID: (id) => set({ cartId: id }),
  setCarts: (items) => set({ carts: items }),
  setCartsTotal: (total) => set({ cartsTotal: total }),
  setCoupon: (v) => {
    set({ coupon: v })
    if (v) sessionStorage.setItem('coupon', v)
    else sessionStorage.removeItem('coupon')
  },
  setCouponValue: (v) => {
    set({ coupon: v })
    if (v) sessionStorage.setItem('coupon', v)
    else sessionStorage.removeItem('coupon')
  },
  getCartID: async () => {
    const cartId = await api.getCartId()
    set({ cartId })
    setStored('cartId', cartId, { expires: 1 })
    return cartId
  },
  getCartsList: async () => {
    const cartId = get().cartId
    if (!cartId) return []
    const result = await api.getCartList(cartId)
    const list = (result || []).map((item: CartItem) => ({ ...item, disableminus: false }))
    set({ carts: list })
    return list
  },
  cartsTotals: async () => {
    const cartId = get().cartId
    if (!cartId) return {}
    const [result, zheRes] = await Promise.all([
      api.getCartsTotals(cartId),
      api.getZhe(cartId).catch(() => null),
    ])
    const merged: Record<string, any> = { ...(result || {}) }
    try {
      const parsed =
        zheRes == null ? null : typeof zheRes === 'string' ? JSON.parse(zheRes) : zheRes
      if (parsed && typeof parsed === 'object') {
        const { zhe_price, zhe_point } = parsed as { zhe_price?: unknown; zhe_point?: unknown }
        merged.zhe_price = zhe_price
        merged.zhe_point = zhe_point
      }
    } catch {
    }
    set({ cartsTotal: merged })
    return merged
  },
  resetCart: async () => {
    removeStored('cartId')
    set({ cartId: null, carts: [], cartsTotal: {} })
    return get().getCartID()
  },
}))

export function getCouponHeader() {
  const fromSession =
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('coupon')) || ''
  if (fromSession) return fromSession
  return useCartStore.getState().coupon || ''
}

export function hydrateCartCredentialsFromSession() {
  if (typeof sessionStorage === 'undefined') return
  const coupon = sessionStorage.getItem('coupon') || ''
  const state = useCartStore.getState()
  if (coupon && !state.coupon) state.setCoupon(coupon)
}
