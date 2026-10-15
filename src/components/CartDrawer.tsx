import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Divider, Popup, Stepper } from 'antd-mobile'
import { api } from '@/api'
import { useCartStore, type CartItem } from '@/stores/cart'
import { useUiStore, resolveSessionId } from '@/stores/session'
import { onConnect } from '@/lib/connectWallet.js'
import { useWalletStore } from '@/stores/wallet'
import { showLoading, hideLoading, showToast, localizeCancelledByUserTip } from '@/lib/tips'
import { isRtlLang } from '@/i18n'
import './CartDrawer.less'
const iconDelete = ''

const SKU_NAMES: Record<string, string> = {
  S1: 's1.safepal_s1_hardware_wallet',
  X1: 'x1.safepal_x1_hardware_wallet',
  S1P: 's1p.safepal_s1_pro_hardware_wallet',
  CY: 'cy.safepal_cypher_seed_board',
  LC: 'lc.safepal_leather_case',
}

export default function CartDrawer() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const cartId = useCartStore((s) => s.cartId)
  const carts = useCartStore((s) => s.carts)
  const cartsTotal = useCartStore((s) => s.cartsTotal)
  const getCartsList = useCartStore((s) => s.getCartsList)
  const cartsTotals = useCartStore((s) => s.cartsTotals)
  const cartVisible = useUiStore((s) => s.cartVisible)
  const setCartVisible = useUiStore((s) => s.setCartVisible)
  const setSignInVisible = useUiStore((s) => s.setSignInVisible)
  const wallet = useWalletStore((s) => s.wallet)
  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    if (cartId) {
      getCartsList()
      cartsTotals()
    }
  }, [cartId, getCartsList, cartsTotals])

  const showList = useMemo(
    () =>
      carts.map((item): CartItem => ({
        ...item,
        name: SKU_NAMES[item.sku] ? t(SKU_NAMES[item.sku]) : item.name,
      })),
    [carts, t],
  )

  const totalQty = cartsTotal?.items_qty || 0
  const { zhe_point, zhe_price, subtotal, base_subtotal } = cartsTotal || {}
  const hasZheDiscount =
    zhe_point != null &&
    zhe_price != null &&
    `${zhe_point}` !== '0' &&
    `${zhe_price}` !== `${subtotal}`

  const updateQty = async (itemId: string | number, qty: number) => {
    if (!cartId) return
    showLoading()
    try {
      await api.changeCartItem(cartId, itemId, { cartItem: { qty } })
      await getCartsList()
      await cartsTotals()
    } catch (error: any) {
      showToast(error?.msg || error?.message || 'Error')
    } finally {
      hideLoading()
    }
  }

  const deleteItem = async (itemId: string | number) => {
    if (!cartId) return
    showLoading()
    try {
      await api.deleteCartItem(cartId, itemId)
      await getCartsList()
      await cartsTotals()
    } catch (error: any) {
      showToast(error?.msg || error?.message || 'Error')
    } finally {
      hideLoading()
    }
  }

  const checkOut = async () => {
    if (!wallet?.currentAccount) {
      if (!resolveSessionId()) {
        setSignInVisible(true, () => {
          setCartVisible(false)
          sessionStorage.removeItem('shippingMethodRadio')
          navigate('/shopping/address')
        })
        return
      }
      setCheckingOut(true)
      try {
        const res = await onConnect()
        if (!res) {
          setCheckingOut(false)
          return
        }
        useWalletStore.getState().setWallet(res)
        useWalletStore.getState().setIsConnect(!!res.isConnected)
      } catch (error: any) {
        showToast(localizeCancelledByUserTip(error?.message || 'Connect failed'))
        setCheckingOut(false)
        return
      }
      setCheckingOut(false)
    }
    setCartVisible(false)
    sessionStorage.removeItem('shippingMethodRadio')
    navigate('/shopping/address')
  }

  return (
    <>
      <div className="cart-box">
        <Badge content={totalQty || null} bordered>
          <button type="button" className="icon-cart" onClick={() => setCartVisible(true)} aria-label="Cart"></button>
        </Badge>
      </div>
      <Popup
        visible={cartVisible}
        onMaskClick={() => setCartVisible(false)}
        position={isRtlLang(i18n.language) ? 'left' : 'right'}
        bodyStyle={{ width: 'calc(var(--h5-col, 100vw) * 0.8)', height: '100%' }}
        showCloseButton
        onClose={() => setCartVisible(false)}
      >
        <div className="cart-list-popup">
          <div className="title">
            <h3>{t('common.my_cart')}</h3>
          </div>
          {showList.length ? (
            <div className="list-box">
              {showList.map((item, index) => (
                <div key={item.item_id ?? index} className='list-item-box-container'>
                  <div key={item.item_id ?? index} className="list-item-box">
                    <div className="item-image">
                      <img src={`https://static.isafepal.com/mshop/dev/${item.sku}.png`} alt="" width={60} />
                    </div>
                    <div className="item-content-box">
                      <div className="item-content">
                        <div className="title-item">{item.name}</div>
                        <div className="qty-price flex-row">
                          <div className="qty">
                            <Stepper
                              key={item.item_id}
                              digits={0}
                              min={1}
                              value={item.qty}
                              onChange={(val) => updateQty(item.item_id, val)}
                            />
                          </div>
                          <div className="price">${item.price}</div>
                        </div>
                      </div>
                      <div className="item-delete">
                          <img onClick={() => deleteItem(item.item_id)} src={iconDelete} alt="" srcSet="" />
                      </div>
                    </div>
                  </div>
                  { (index !== showList.length - 1) && <Divider style={{ borderColor: '#E1E0EC', margin: '0'}} /> }
                </div>
              ))}
            </div>
          ) : (
            <div className="no-items">
              <div className='no-items-text'>{t('common.cart_empty')}</div>
            </div>
          )}
          <Divider style={{ borderColor: '#E1E0EC', margin: '0', 'padding': '0px 16px'}} />
          <div className="list-total">
            <div className="flex-row total-content">
              <div className="items">{cartsTotal.items_qty} {t('checkout.Items')}</div>
              <div className="total-price">
                <span className="total-text">{ t('checkout.total') }</span>
                <span className="price-text">
                  {hasZheDiscount ? (
                    <>
                      <span className="hasDiscount">$</span>
                      <span style={{ paddingLeft: '3px' }}>{zhe_price}</span>
                      <span
                        style={{
                          fontSize: '12px',
                          marginLeft: '4px',
                          color: '#C3BAE7',
                          textDecoration: 'line-through',
                        }}
                      >
                        ${subtotal}
                      </span>
                    </>
                  ) : subtotal === base_subtotal ? (
                    <>
                      <span>$</span>
                      <span style={{ paddingLeft: '3px' }}>{subtotal}</span>
                    </>
                  ) : (
                    <>
                      <span>$</span>
                      <span style={{ paddingLeft: '3px' }}>{base_subtotal}</span>
                      <span
                        style={{
                          fontSize: '12px',
                          marginLeft: '4px',
                          color: '#FF453A',
                          textDecoration: 'line-through',
                        }}
                      >
                        (${subtotal})
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className="check-out">
              <Button block className="btn-accent" disabled={!showList.length || checkingOut} onClick={checkOut}>
                {t('common.checkout')}
              </Button>
            </div>
          </div>
        </div>
      </Popup>
    </>
  )
}
