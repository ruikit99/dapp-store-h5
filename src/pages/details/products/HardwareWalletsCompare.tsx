import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/api'
import { useCartStore } from '@/stores/cart'
import { useUiStore } from '@/stores/session'
import { showLoading, hideLoading, showToast } from '@/lib/tips'
import {
  HW_FEATURES,
  hwSkuValueIndex,
  sortHwProducts,
  type HwFeature,
  type HwFeatureValue,
  type HwProduct,
} from './data/hwCompareData'
import './HardwareWalletsCompare.less'

const HEADER_OFFSET = 70

type Props = {
  prioritySku?: string
  titleKey?: string
  fixedBarEndSelector?: string
}

function productTitle(p: HwProduct, t: (k: string) => string) {
  if (p.titleKey) return t(p.titleKey)
  return p.titleFallback || p.pillLabel
}

function FeatureCell({
  feature,
  value,
  t,
}: {
  feature: HwFeature
  value: HwFeatureValue
  t: (k: string) => string
}) {
  if (feature.type === 'check') {
    return <img className="compareCheckIcon" src="/images/product_landing/compare-check.svg" alt="" />
  }
  if (feature.type === 'platforms') {
    return (
      <div className="comparePlatformIconBox">
        <img className="comparePlatformIcon" src="/images/product_landing/ios.svg" alt="" />
        <img className="comparePlatformIcon" src="/images/product_landing/Android.svg" alt="" />
        <img className="comparePlatformIcon" src="/images/product_landing/windows.svg" alt="" />
      </div>
    )
  }
  if (feature.type === 'connection' || feature.type === 'button') {
    if (typeof value !== 'object' || !value) return null
    const text = 'textKey' in value ? t(value.textKey) : value.text
    return (
      <div className="comparePlatformIconBox comparePlatformConnection">
        <img className="comparePlatformIcon" src={value.icon} alt="" />
        <span>{text}</span>
      </div>
    )
  }
  if (typeof value === 'string') return <>{t(value)}</>
  return null
}

export default function HardwareWalletsCompare({
  prioritySku = 'S1',
  titleKey = 's1p.you_may_also_like',
  fixedBarEndSelector = '#my-comment',
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const cartId = useCartStore((s) => s.cartId)
  const getCartsList = useCartStore((s) => s.getCartsList)
  const cartsTotals = useCartStore((s) => s.cartsTotals)
  const showAddToCartToast = useUiStore((s) => s.showAddToCartToast)

  const products = useMemo(() => sortHwProducts(prioritySku), [prioritySku])
  const [leftSku, setLeftSku] = useState(products[0]?.sku || 'S1')
  const [rightSku, setRightSku] = useState(products[1]?.sku || 'X1')
  const [fixedVisible, setFixedVisible] = useState(false)
  const mobileRef = useRef<HTMLDivElement>(null)
  const firstBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setLeftSku(products[0]?.sku || 'S1')
    setRightSku(products[1]?.sku || 'X1')
  }, [products])

  const productMap = useMemo(() => {
    const map: Record<string, HwProduct> = {}
    products.forEach((p) => {
      map[p.sku] = p
    })
    return map
  }, [products])

  const leftProduct = productMap[leftSku]
  const rightProduct = productMap[rightSku]

  const addToCart = async (sku: string) => {
    if (!cartId) return
    showLoading()
    try {
      await api.addItemToCart({ cartItem: { sku, qty: 1 } }, cartId)
      await getCartsList()
      await cartsTotals()
      const product = products.find((p) => p.sku === sku)
      showAddToCartToast({
        name: product ? productTitle(product, t) : sku,
        price: product?.price,
        image: product?.image,
        qty: 1,
        sku,
      })
    } catch (error: any) {
      showToast(error?.msg || error?.message || 'Error')
    } finally {
      hideLoading()
    }
  }

  const goDetail = (sku: string) => {
    navigate(`/details/${sku}`)
  }

  const onPillClick = (sku: string) => {
    if (sku === leftSku || sku === rightSku) return
    setRightSku(sku)
  }

  const updateFixedVisibility = useCallback(() => {
    const endEl = document.querySelector(fixedBarEndSelector)
    const btn = firstBtnRef.current
    if (!btn) {
      setFixedVisible(false)
      return
    }
    const showThreshold = btn.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET - 10
    const scrollPos = window.scrollY
    let visible = scrollPos >= showThreshold
    if (endEl) {
      const endTop = (endEl as HTMLElement).offsetTop
      if (scrollPos > endTop - HEADER_OFFSET - 150) visible = false
    }
    setFixedVisible(visible)
  }, [fixedBarEndSelector])

  useEffect(() => {
    updateFixedVisibility()
    window.addEventListener('scroll', updateFixedVisibility, { passive: true })
    window.addEventListener('resize', updateFixedVisibility)
    return () => {
      window.removeEventListener('scroll', updateFixedVisibility)
      window.removeEventListener('resize', updateFixedVisibility)
    }
  }, [updateFixedVisibility, leftSku, rightSku])

  if (!leftProduct || !rightProduct) return null

  return (
    <div className="hw-compare-root" id="HardwareWallets" data-fixed-bar-end={fixedBarEndSelector}>
      <div
        className="hwCompare hwCompare--mobile"
        ref={mobileRef}
        data-left-sku={leftSku}
        data-right-sku={rightSku}
      >
        <div className="hwExploreHeader">
          <h2 className="hwExploreTitle">{t(titleKey)}</h2>
        </div>

        <div className="hwCompareMobileSelector">
          {products.map((product, i) => (
            <span key={product.sku} style={{ display: 'contents' }}>
              {i > 0 ? <span className="hwCompareMobileVs">VS</span> : null}
              <button
                type="button"
                className={`hwComparePill ${product.pillActiveClass}${
                  product.sku === leftSku || product.sku === rightSku ? ' is-active' : ''
                }`}
                data-sku={product.sku}
                onClick={() => onPillClick(product.sku)}
              >
                {product.pillLabel}
              </button>
            </span>
          ))}
        </div>

        <div className="hwCompareMobileCards">
          {([leftProduct, rightProduct] as const).map((product, idx) => {
            const slot = idx === 0 ? 'left' : 'right'
            const cardTheme = product.sku === leftSku ? 'purple' : 'green'
            return (
              <div
                key={slot}
                className={`hwCompareMobileCard hwCompareMobileCard--${slot} hwCompareMobileCard--theme-${cardTheme}`}
                data-slot={slot}
                data-sku={product.sku}
              >
                <button type="button" className="hwCompareMobileCardImg" onClick={() => goDetail(product.sku)}>
                  <img src={product.image} alt="" />
                </button>
                <div className="hwCompareMobileCardTitle">{productTitle(product, t)}</div>
                <div className={`hwCompareMobileCardPrice ${product.boxClass}`}>{product.price}</div>
                <button
                  ref={idx === 0 ? firstBtnRef : undefined}
                  type="button"
                  className="addToCartBtn hwCompareMobileCardBtn"
                  onClick={() => addToCart(product.sku)}
                >
                  {t('common.add_to_cart')}
                </button>
              </div>
            )
          })}
        </div>

        <div className="hwCompareMobileSpecs">
          {HW_FEATURES.map((feature, i) => (
            <div key={feature.labelKey}>
              {i > 0 ? (
                <div className="divider">
                  <span className="content">vs</span>
                </div>
              ) : null}
              <div className="hwCompareMobileRow">
                <div className="hwCompareMobileRowValues">
                  {[leftSku, rightSku].map((sku, slotIdx) => {
                    const valueIdx = hwSkuValueIndex(sku)
                    const value = feature.values[valueIdx]
                    const product = productMap[sku]
                    return (
                      <div
                        key={`${feature.labelKey}-${sku}`}
                        className={`hwCompareMobileValue ${product.boxClass}`}
                        data-slot={slotIdx === 0 ? 'left' : 'right'}
                      >
                        <div
                          className="hwCompareMobileRowLabel"
                          dangerouslySetInnerHTML={{ __html: t(feature.labelKey) }}
                        />
                        <div className="hwCompareMobileValueContent">
                          <FeatureCell feature={feature} value={value} t={t} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        id="fiexdBtn"
        className="hwCompareFixedBar"
        style={{ display: fixedVisible ? 'block' : 'none', top: HEADER_OFFSET }}
      >
        <div className="fiexdBtnBox fiexdBtnBox--mobile" style={{ width: '100%' }}>
          {([leftProduct, rightProduct] as const).map((product, idx) => (
            <div
              key={product.sku + idx}
              className={`hwFixedMobileItem ${product.boxClass}`}
              data-slot={idx === 0 ? 'left' : 'right'}
              data-sku={product.sku}
            >
              <div className="title">{productTitle(product, t)}</div>
              <div className="price">{product.price}</div>
              <button type="button" className="addToCartBtn" onClick={() => addToCart(product.sku)}>
                {t('common.add_to_cart')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
