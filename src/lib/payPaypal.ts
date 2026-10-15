import { api } from '@/api'
import { showLoading, hideLoading, showToast } from '@/lib/tips'

const PAYPAL_SDK_URL =
  'https://www.paypal.com/sdk/js?client-id=xxxxxx'

declare global {
  interface Window {
    paypal_sdk?: any
  }
}

let sdkLoading: Promise<any> | null = null

export function loadPaypalSdk(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.paypal_sdk) return Promise.resolve(window.paypal_sdk)
  if (sdkLoading) return sdkLoading

  sdkLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src^="https://www.paypal.com/sdk/js"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(window.paypal_sdk))
      existing.addEventListener('error', () => reject(new Error('PayPal SDK load failed')))
      return
    }
    const script = document.createElement('script')
    script.src = PAYPAL_SDK_URL
    script.async = true
    script.defer = true
    script.setAttribute('data-namespace', 'paypal_sdk')
    script.onload = () => resolve(window.paypal_sdk)
    script.onerror = () => reject(new Error('PayPal SDK load failed'))
    document.head.appendChild(script)
  })
  return sdkLoading
}

export type PaypalButtonsOpts = {
  cartId: string
  email: string
  containerId?: string
  onSuccess: (orderNumber: string) => void
  onError?: (error: any) => void
  clearCart: () => Promise<void>
}

export async function renderPaypalButtons(opts: PaypalButtonsOpts): Promise<() => void> {
  const {
    cartId,
    email,
    containerId = 'paypalBox',
    onSuccess,
    onError,
    clearCart,
  } = opts

  const paypal_sdk = await loadPaypalSdk()
  if (!paypal_sdk?.Buttons) throw new Error('PayPal SDK unavailable')

  const el = document.getElementById(containerId)
  if (el) el.innerHTML = ''

  const buttons = paypal_sdk.Buttons({
    style: { color: 'white' },
    enableStandardCardFields: true,
    onClick: async () => {
      try {
        showLoading()
        await api.setPaymentInformation(cartId, {
          cartId,
          email,
          paymentMethod: { method: 'paypal_express' },
        })
      } catch (e) {
        /* ignore set payment errors; createOrder will surface issues */
      } finally {
        hideLoading()
      }
    },
    createOrder: () => {
      showLoading()
      return api
        .createPaypalExpressToken({ cart_id: cartId })
        .then((res: any) => {
          const result = Array.isArray(res) ? res[0] : res
          const { token, code, message } = result || {}
          if (code === 200 && token) return token
          throw { code, message: message || 'PayPal token failed' }
        })
        .finally(() => hideLoading())
    },
    onApprove: (data: { orderID: string; payerID: string }) => {
      const { orderID, payerID } = data
      showLoading()
      return api
        .setpaymentmethodoncart({
          cart_id: cartId,
          payer_id: payerID,
          token: orderID,
          payment_method: 'paypal_express',
        })
        .then(() => api.paypalPlaceOrder({ cart_id: cartId }))
        .then(async (res: any) => {
          const result = Array.isArray(res) ? res[0] : res
          const { code, order_number, message } = result || {}
          if (code === 200) {
            await clearCart()
            onSuccess(order_number || orderID)
            return
          }
          throw { code, message: message || 'PayPal place order failed' }
        })
        .catch((error: any) => {
          showToast(error?.message || 'PayPal failed')
          onError?.(error)
        })
        .finally(() => hideLoading())
    },
  })

  await buttons.render(`#${containerId}`)
  return () => {
    try {
      buttons.close?.()
    } catch {
      /* ignore */
    }
  }
}
