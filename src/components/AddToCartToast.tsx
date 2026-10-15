import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/stores/session'
import './AddToCartToast.less'

const TOAST_MS = 3000
const CDN_FALLBACK = 'https://static.isafepal.com/mshop/dev'

export default function AddToCartToast() {
  const { t } = useTranslation()
  const payload = useUiStore((s) => s.addToCartToast)
  const hideAddToCartToast = useUiStore((s) => s.hideAddToCartToast)
  const setCartVisible = useUiStore((s) => s.setCartVisible)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!payload) {
      setVisible(false)
      return
    }
    setVisible(false)
    const frame = requestAnimationFrame(() => setVisible(true))
    const timer = window.setTimeout(() => hideAddToCartToast(), TOAST_MS)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [payload, hideAddToCartToast])

  if (!payload) return null

  const imgSrc = payload.image || (payload.sku ? `${CDN_FALLBACK}/${payload.sku}.png` : '')
  const priceText = String(payload.price ?? '').replace(/^\$/, '')
  const qty = payload.qty || 1

  const onClick = () => {
    hideAddToCartToast()
    setCartVisible(true)
  }

  return (
    <div
      className={`add-to-cart-toast${visible ? ' is-visible' : ''}`}
      role="status"
      onClick={onClick}
    >
      <div className="add-to-cart-toast-box">
        <div className="toast-thumb">
          {imgSrc ? <img src={imgSrc} alt="" /> : null}
        </div>
        <div className="toast-info">
          <div className="toast-status">
            {t('store.added_to_cart')}({qty})
          </div>
          <div className="toast-name">{payload.name}</div>
          {priceText ? <div className="toast-price">${priceText}</div> : null}
        </div>
        <div className="toast-arrow" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 3L11 8L6 13" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}
