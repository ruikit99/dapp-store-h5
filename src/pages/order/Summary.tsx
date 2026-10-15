import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, Divider, Input, Popup } from 'antd-mobile'
import { CheckCircleFill, CloseCircleFill, CloseOutline, RightOutline, SearchOutline } from 'antd-mobile-icons'
import { api } from '@/api'
import { useCartStore, getCouponHeader } from '@/stores/cart'
import { useWalletStore } from '@/stores/wallet'
import { resolveSessionId } from '@/stores/session'
import { requireWallet } from '@/components/WalletGuard'
import PaymentMethods from '@/components/PaymentMethods'
import SwitchNet from '@/components/SwitchNet'
import {
  findShippingMethod,
  getShippingMethodLabel,
  localizeShippingText,
  type ShippingMethod,
} from '@/components/LogisticsTips'
import { showLoading, hideLoading, showToast } from '@/lib/tips'
import {
  buildPaymentPayload,
  loadPaymentMethodsFromShipping,
  openAlipayCheckout,
  openBinanceCheckout,
  sendWalletTrans,
} from '@/lib/payHelpers'
import { renderPaypalButtons } from '@/lib/payPaypal'
import { removeStored } from '@/lib/browserStorage'
import { getClientData } from '@/lib/safepalConnectorH5'
import './Summary.less'

const COUNTDOWN_MS = 3 * 60 * 1000
const EDIT_ICON = '/images/edit.svg'

type CoinGroup = {
  label: string
  options: any[]
  disable: boolean
}

function dealTokenAmount(amount: any) {
  if (!amount && amount !== 0) return amount
  const str = `${amount}`
  const targetStr = str.replace(/\.?0+$/, '')
  const isToFixed = targetStr.includes('.') && targetStr.split('.')[1].length > 2
  if (!isToFixed) {
    return targetStr ? (Number(targetStr) || 0).toFixed(2) : targetStr
  }
  return targetStr
}

function assembleBalances(balances: any[]): CoinGroup[] {
  const available: any[] = []
  const insufficient: any[] = []
  const nosupport: any[] = []
  balances?.forEach((item) => {
    if (item.enoughForOrder && item.acceptedByMerchant) {
      available.push(item)
    } else if (!item.enoughForOrder && item.acceptedByMerchant) {
      insufficient.push(item)
    } else if (!item.acceptedByMerchant) {
      nosupport.push(item)
    }
  })
  return [
    { label: 'Available', options: available, disable: false },
    { label: 'Insufficient Balance', options: insufficient, disable: true },
    { label: 'Not supported by this merchant', options: nosupport, disable: true },
  ]
}

function resolveSymbolLogoUrl(symbol?: string) {
  const normalized = `${symbol || ''}`.trim()
  if (!normalized) return ''
  return `https://static.isafepal.com/coin/bn/${normalized}.png`
}

function resolvePayLogoUrl(logoUrl?: string) {
  const url = `${logoUrl || ''}`.trim()
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `https://pay.safepal.com${url.startsWith('/') ? '' : '/'}${url}`
}

function buildEstimatePayloadFromShipping(addr: Record<string, string>) {
  const payload: Record<string, any> = {
    address: {
      street: [addr.street],
      city: addr.city,
      region: addr.province,
      country_id: addr.countryId,
      postcode: addr.postalCode,
      firstname: addr.firstName,
      lastname: addr.lastName,
      company: addr.company || '',
      telephone: addr.phoneNumber,
      vat_id: addr.taxNumber || '',
      custom_attributes: [
        {
          attribute_code: 'id_number',
          value: addr.identification || '',
        },
      ],
    },
  }
  if (addr.provinceId) payload.address.region_id = addr.provinceId
  return payload
}

function parseParamShippingInf() {
  try {
    return JSON.parse(sessionStorage.getItem('paramShippingInf') || 'null')
  } catch {
    return null
  }
}

function PriceValue({
  base,
  original,
}: {
  base: any
  original: any
}) {
  return (
    <span>
      ${base}
      {base !== original ? (
        <span style={{ color: '#FF453A', textDecoration: 'line-through', fontSize: 12 }}>(${original})</span>
      ) : null}
    </span>
  )
}

export default function OrderSummaryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const cartId = useCartStore((s) => s.cartId)
  const carts = useCartStore((s) => s.carts)
  const cartsTotal = useCartStore((s) => s.cartsTotal)
  const getCartsList = useCartStore((s) => s.getCartsList)
  const cartsTotals = useCartStore((s) => s.cartsTotals)
  const getCartID = useCartStore((s) => s.getCartID)
  const setCartID = useCartStore((s) => s.setCartID)
  const wallet = useWalletStore((s) => s.wallet)
  const netValue = useWalletStore((s) => s.netValue)
  const setNetAssign = useWalletStore((s) => s.setNetAssign)
  const setNetValue = useWalletStore((s) => s.setNetValue)

  const [shipping, setShipping] = useState<Record<string, string>>({})
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod | undefined>()
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true)
  const [radioPayment, setRadioPayment] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState(false)
  const [couponNotFreeShipping, setCouponNotFreeShipping] = useState(false)
  const [couponCancelDisabled, setCouponCancelDisabled] = useState(false)
  const [paying, setPaying] = useState(false)
  const [orderHaved, setOrderHaved] = useState('')
  const [coinGroups, setCoinGroups] = useState<CoinGroup[]>([])
  const [copyCoinList, setCopyCoinList] = useState<CoinGroup[]>([])
  const [coinsLength, setCoinsLength] = useState(0)
  const [coinLoading, setCoinLoading] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState<any>(null)
  const [selectTokenOpen, setSelectTokenOpen] = useState(false)
  const [selectNetOpen, setSelectNetOpen] = useState(false)
  const [selectTokenIsHasChange, setSelectTokenIsHasChange] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [countDownSec, setCountDownSec] = useState(180)
  const [countdownKey, setCountdownKey] = useState(0)
  const [cryptoCountdownActive, setCryptoCountdownActive] = useState(true)
  const [logoFallbackMap, setLogoFallbackMap] = useState<Record<string, boolean>>({})
  const paypalDestroyRef = useRef<(() => void) | null>(null)
  const searchThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const radioPaymentRef = useRef(radioPayment)
  const orderHavedRef = useRef(orderHaved)
  const bootstrapDoneRef = useRef(false)
  const refreshShippingAndPaymentRef = useRef<
    (addr: Record<string, string>, methodCode: string) => Promise<void>
  >(async () => {})

  useEffect(() => {
    radioPaymentRef.current = radioPayment
  }, [radioPayment])

  useEffect(() => {
    orderHavedRef.current = orderHaved
  }, [orderHaved])

  const addressPath = '/shopping/address'

  const isSolana = Number(wallet?.chainId) === -99 || wallet?.name === 'SOLANA'
  const isTron = Number(wallet?.chainId) === -98 || wallet?.name === 'TRON'
  const isFree = Number(cartsTotal?.grand_total) === 0 && Boolean(cartsTotal?.coupon_code)
  const canPayNow = shippingMethods.length > 0
  const { zhe_point, zhe_price, subtotal, base_subtotal, base_grand_total, grand_total } = cartsTotal || {}
  const hasZheDiscount =
    zhe_point != null &&
    zhe_price != null &&
    `${zhe_point}` !== '0' &&
    `${zhe_price}` !== `${subtotal}`
  const zheDiscountAmount = hasZheDiscount
    ? Math.max(0, Number(base_subtotal) - Number(zhe_price))
    : 0
  const displayGrandTotal = hasZheDiscount
    ? Number(base_grand_total) - zheDiscountAmount
    : base_grand_total
  const hasSelectToken = Boolean(selectedCoin && Object.keys(selectedCoin).length)
  const showCryptoPanel =
    !isFree && radioPayment === 'safepalpay_cryptopay' && !orderHaved && cryptoCountdownActive
  const showPayBtn =
    isFree ||
    ['alipay_cryptopay_cn', 'alipay_cryptopay_hk', 'binancepay_cryptopay', 'safepalpay_cryptopay'].includes(
      radioPayment,
    )

  const shippingSelect = useMemo(() => {
    const segments = cartsTotal?.total_segments || []
    const item = segments.find((s: any) => s?.code === 'shipping')
    if (!item) {
      return {
        value: selectedMethod?.amount ?? selectedMethod?.price_incl_tax ?? 0,
        title: getShippingMethodLabel(selectedMethod, t),
      }
    }
    let title = item.title || ''
    const idx = title.indexOf('(')
    if (idx > -1) {
      title = title.substr(idx).replace(/\(/g, '').replace(/\)/g, '')
    }
    return { ...item, title, value: item.value }
  }, [cartsTotal, selectedMethod, t])

  const estimateShippingText = useMemo(
    () => localizeShippingText(shippingSelect.title, t) || getShippingMethodLabel(selectedMethod, t),
    [shippingSelect.title, selectedMethod, t],
  )

  const showList = useMemo(() => {
    const listName: Record<string, string> = {
      S1: t('s1.safepal_s1_hardware_wallet'),
      X1: t('x1.safepal_x1_hardware_wallet'),
      'X1-C': t('x1.safepal_x1c_hardware_wallet'),
      S1P: t('s1p.safepal_s1_pro_hardware_wallet'),
      CY: t('cy.safepal_cypher_seed_board'),
      LC: t('lc.safepal_leather_case'),
    }
    return carts.map((item) => ({
      ...item,
      name: listName[item.sku] || item.name || item.sku,
    }))
  }, [carts, t])

  const tokenListText: Record<string, string> = {
    Available: t('home.available'),
    'Insufficient Balance': t('home.insufficient_balance'),
    'Not supported by this merchant': t('home.not_supported_merchant'),
  }

  const loadPaymentMethods = useCallback(
    async (countryId?: string) => {
      if (!cartId) {
        setPaymentMethodsLoading(false)
        return
      }
      setPaymentMethodsLoading(true)
      try {
        const methods = await loadPaymentMethodsFromShipping(cartId, countryId)
        setPaymentMethods(methods)
      } finally {
        setPaymentMethodsLoading(false)
      }
    },
    [cartId],
  )

  const renderPaymentMethodsFromSession = useCallback(
    async (countryId?: string, couponHeader?: string, paramShippingInf?: any) => {
      if (!cartId) return
      let params = paramShippingInf ?? parseParamShippingInf()
      if (!params) {
        await loadPaymentMethods(countryId)
        return
      }
      setPaymentMethodsLoading(true)
      try {
        const header = couponHeader ?? getCouponHeader()
        const res: any = await api.shippingInformation(cartId, params, header)
        let methods = res?.payment_methods?.length ? [...res.payment_methods] : []
        if (!methods.length) {
          await loadPaymentMethods(countryId)
          return
        }
        if (countryId && ['CN', 'HK', 'MO'].includes(countryId)) {
          if (!methods.some((m: any) => m.code === 'alipay_hk_cryptopay')) {
            methods.push({ code: 'alipay_hk_cryptopay', title: 'AliPay HK' })
          }
        }
        setPaymentMethods(methods)
      } catch {
        await loadPaymentMethods(countryId)
      } finally {
        setPaymentMethodsLoading(false)
      }
    },
    [cartId, loadPaymentMethods],
  )

  const fetchCoinList = useCallback(
    async (silent = false) => {
      if (!wallet?.currentAccount || !cartId || orderHaved || !cryptoCountdownActive) return
      if (!silent) setCoinLoading(true)
      try {
        const coins: any = await api.getMchCoinList({
          cartId,
          chainId: wallet.chainId,
          address: wallet.currentAccount,
        })
        const raw = Array.isArray(coins?.balances)
          ? coins.balances
          : Array.isArray(coins)
            ? coins
            : coins?.data || coins?.list || []
        const looksGrouped = raw.some((g: any) => Array.isArray(g?.options))
        const groups: CoinGroup[] = looksGrouped
          ? raw.map((g: any) => ({
              label: g.label,
              options: g.options || [],
              disable: Boolean(g.disable),
            }))
          : assembleBalances(raw)
        const all = looksGrouped ? raw.flatMap((g: any) => g.options || []) : raw
        setCoinsLength(all.length)
        setCoinGroups(groups)
        setCopyCoinList(groups)
        setSelectTokenIsHasChange(true)
        setSelectedCoin((prev: any) => {
          if (!prev?.symbol) return null
          const found = all.find((item: any) => item.symbol === prev.symbol)
          if (found?.enoughForOrder && found?.acceptedByMerchant) return found
          return null
        })
      } catch (error: any) {
        setCryptoCountdownActive(false)
        showToast(error?.message || 'Failed to load coins')
      } finally {
        if (!silent) setCoinLoading(false)
        if (!(wallet as any)?.netIsSupport) {
          setCryptoCountdownActive(false)
        }
      }
    },
    [wallet?.currentAccount, wallet?.chainId, wallet, cartId, orderHaved, cryptoCountdownActive],
  )

  const refreshShippingAndPayment = useCallback(
    async (addr: Record<string, string>, methodCode: string) => {
      if (!cartId) return
      const couponHeader = getCouponHeader()
      try {
        const payload = buildEstimatePayloadFromShipping(addr)
        const methods: any = await api.estimateShippingMethods(cartId, payload, couponHeader)
        const list = (methods || []) as ShippingMethod[]
        setShippingMethods(list)

        let paramShippingInf = parseParamShippingInf()
        let selected = findShippingMethod(list, methodCode) || list[0]
        const effectiveCode = methodCode || selected?.method_code || ''

        if (effectiveCode === 'standard_shipping') {
          const standardIdx = list.findIndex((item) => item.method_code === 'standard_shipping')
          if (standardIdx > -1) {
            const standard = list[standardIdx]
            if (standard?.carrier_title?.slice(-1) === '-') {
              setCouponNotFreeShipping(true)
              if (paramShippingInf?.addressInformation) {
                paramShippingInf = {
                  ...paramShippingInf,
                  addressInformation: {
                    ...paramShippingInf.addressInformation,
                    shipping_method_code: 'standard_shipping',
                  },
                }
              }
            } else {
              setCouponNotFreeShipping(false)
            }
            await renderPaymentMethodsFromSession(addr.countryId, couponHeader, paramShippingInf)
          } else {
            const targetIdx = list.findIndex((item) => item.carrier_title?.includes('Standard'))
            if (targetIdx > -1 && paramShippingInf?.addressInformation) {
              paramShippingInf = {
                ...paramShippingInf,
                addressInformation: {
                  ...paramShippingInf.addressInformation,
                  shipping_method_code: list[targetIdx].method_code,
                },
              }
              selected = list[targetIdx]
            }
            setCouponNotFreeShipping(false)
            await renderPaymentMethodsFromSession(addr.countryId, couponHeader, paramShippingInf)
          }
        } else {
          setCouponNotFreeShipping(false)
          await renderPaymentMethodsFromSession(addr.countryId, couponHeader, paramShippingInf)
        }

        setSelectedMethod(selected)
        await cartsTotals()

        const totals = useCartStore.getState().cartsTotal
        const freeOrder = Number(totals?.grand_total) === 0 && Boolean(totals?.coupon_code)
        if (radioPaymentRef.current === 'safepalpay_cryptopay' && !freeOrder && !orderHavedRef.current) {
          setCryptoCountdownActive(true)
          setCountdownKey((k) => k + 1)
          fetchCoinList()
        }
      } catch (error: any) {
        setPaymentMethodsLoading(false)
        showToast(error?.message || 'Estimate failed')
      }
    },
    [cartId, cartsTotals, renderPaymentMethodsFromSession, fetchCoinList],
  )

  useEffect(() => {
    refreshShippingAndPaymentRef.current = refreshShippingAndPayment
  }, [refreshShippingAndPayment])

  const clearCartAfterOrder = useCallback(async () => {
    removeStored('cartId')
    setCartID(null)
    localStorage.removeItem('shipping')
    try {
      await getCartID()
    } catch {
      /* ignore */
    }
  }, [getCartID, setCartID])

  const markOrderCreated = useCallback((entityId: string | number) => {
    const id = String(entityId)
    setOrderHaved(id)
    setCryptoCountdownActive(false)
    sessionStorage.setItem('entityId', id)
  }, [])

  const toOrderDetail = useCallback(() => {
    if (['binancepay_cryptopay', 'alipay_cryptopay_cn', 'alipay_cryptopay_hk'].includes(radioPayment)) {
      navigate('/order', { replace: true })
    } else {
      navigate(`/order/detail/${orderHaved}`, { replace: true })
    }
  }, [navigate, orderHaved, radioPayment])

  useEffect(() => {
    const isReload = sessionStorage.getItem('isReload')
    if (isReload) {
      sessionStorage.removeItem('isReload')
      window.location.reload()
    }
  }, [])

  useEffect(() => {
    const pendingEntityId = sessionStorage.getItem('entityId')
    if (pendingEntityId) {
      sessionStorage.removeItem('entityId')
      navigate(`/order/detail/${pendingEntityId}`, { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    if (!selectTokenIsHasChange) return
    const id = window.setTimeout(() => setSelectTokenIsHasChange(false), 3000)
    return () => window.clearTimeout(id)
  }, [selectTokenIsHasChange])

  useEffect(() => {
    if (!cartId || bootstrapDoneRef.current) return
    bootstrapDoneRef.current = true

    const bootstrap = async () => {
      const saved = localStorage.getItem('shipping')
      if (!saved) {
        setPaymentMethodsLoading(false)
        Dialog.alert({
          content: t('payment.current_information_is_not_complete'),
          confirmText: 'OK',
        }).then(() => navigate('/', { replace: true }))
        return
      }

      const addr = JSON.parse(saved) as Record<string, string>
      setShipping(addr)

      const list = await getCartsList().catch((error: any) => {
        if (error?.invalidCart) return []
        throw error
      })
      if (!list?.length) {
        setPaymentMethodsLoading(false)
        Dialog.alert({
          content: t('payment.shopping_cart_have_expired'),
          confirmText: 'OK',
        }).then(() => navigate('/', { replace: true }))
        return
      }

      await cartsTotals()
      if (!cartId) {
        setPaymentMethodsLoading(false)
        return
      }

      const methodCode = sessionStorage.getItem('shippingMethodRadio') || ''

      const runEstimate = async () => {
        if (!addr) return
        await refreshShippingAndPaymentRef.current(addr, methodCode)
      }

      const applyCode = async (code: string, autoApplied = false) => {
        if (!code) {
          await runEstimate()
          return
        }
        setDiscountCode(code)
        const currentCoupon = useCartStore.getState().cartsTotal?.coupon_code
        if (currentCoupon === code) {
          setCouponSuccess(true)
          setCouponCancelDisabled(true)
          await runEstimate()
          return
        }
        showLoading()
        try {
          await api.useCoupons(cartId, code)
          await cartsTotals()
          setCouponError('')
          setCouponSuccess(true)
          if (autoApplied) setCouponCancelDisabled(true)
          await runEstimate()
        } catch (error: any) {
          setCouponError(error?.message || 'Invalid coupon')
          setCouponSuccess(false)
          await runEstimate()
        } finally {
          hideLoading()
        }
      }

      try {
        if ((window as any).safepalConnector) {
          const clientData = await getClientData()
          const client = `${(clientData as any)?.client || ''}`
          const accountId = client.split(';')[4]
          if (accountId) {
            const hwRes: any = await api.getHwcoupon(accountId)
            const hwCode = `${hwRes?.coupon || hwRes?.coupon_code || hwRes || ''}`.trim()
            if (hwCode) {
              await applyCode(hwCode, false)
              return
            }
          }
          const fallback = useCartStore.getState().cartsTotal?.coupon_code || ''
          if (fallback) {
            setDiscountCode(fallback)
            setCouponSuccess(true)
          }
          await runEstimate()
        } else {
          const fallback = useCartStore.getState().cartsTotal?.coupon_code || ''
          if (fallback) {
            setDiscountCode(fallback)
            setCouponSuccess(true)
          }
          await runEstimate()
        }
      } catch {
        await runEstimate()
      }
    }
    bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId])

  // PayPal SDK Buttons
  useEffect(() => {
    let cancelled = false
    const setup = async () => {
      paypalDestroyRef.current?.()
      paypalDestroyRef.current = null
      if (radioPayment !== 'paypal_express' || !cartId || orderHaved) return
      try {
        const destroy = await renderPaypalButtons({
          cartId,
          email: shipping.email || '',
          onSuccess: (orderNumber) => {
            navigate(`/order/detail/${orderNumber}`)
          },
          clearCart: clearCartAfterOrder,
        })
        if (cancelled) destroy()
        else paypalDestroyRef.current = destroy
      } catch (e: any) {
        showToast(e?.message || 'PayPal init failed')
      }
    }
    setup()
    return () => {
      cancelled = true
      paypalDestroyRef.current?.()
      paypalDestroyRef.current = null
    }
  }, [radioPayment, cartId, shipping.email, orderHaved, navigate, clearCartAfterOrder])

  useEffect(() => {
    if (!showCryptoPanel || !cryptoCountdownActive || orderHaved || !wallet?.currentAccount) return
    fetchCoinList()
  }, [showCryptoPanel, cryptoCountdownActive, orderHaved, wallet?.currentAccount, wallet?.chainId, fetchCoinList])

  useEffect(() => {
    if (!showCryptoPanel || !cryptoCountdownActive || orderHaved) return
    let remaining = COUNTDOWN_MS
    setCountDownSec(Math.floor(COUNTDOWN_MS / 1000))
    const id = window.setInterval(() => {
      remaining -= 1000
      const sec = Math.max(0, Math.floor(remaining / 1000))
      setCountDownSec(sec)
      if (sec === 3) fetchCoinList(true)
      if (remaining <= 0) {
        remaining = COUNTDOWN_MS
        setCountDownSec(Math.floor(COUNTDOWN_MS / 1000))
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [showCryptoPanel, cryptoCountdownActive, orderHaved, wallet?.chainId, countdownKey, fetchCoinList])

  useEffect(() => {
    if (orderHaved || isFree) return
    if (radioPayment === 'safepalpay_cryptopay') {
      setCryptoCountdownActive(true)
      setCountdownKey((k) => k + 1)
    }
  }, [radioPayment, orderHaved, isFree])

  const resolveTokenLogoUrl = (symbol?: string, logoUrl?: string, logoKey?: string) => {
    const key = `${logoKey || ''}`.trim()
    const symbolLogoUrl = resolveSymbolLogoUrl(symbol)
    const payLogoUrl = resolvePayLogoUrl(logoUrl)
    const shouldUseFallback = key && logoFallbackMap[key]
    if (symbolLogoUrl && !shouldUseFallback) return symbolLogoUrl
    return payLogoUrl || symbolLogoUrl || ''
  }

  const handleTokenLogoError = (symbol?: string, logoUrl?: string, logoKey?: string) => {
    const key = `${logoKey || ''}`.trim()
    if (!key) return
    const symbolLogoUrl = resolveSymbolLogoUrl(symbol)
    const payLogoUrl = resolvePayLogoUrl(logoUrl)
    if (!symbolLogoUrl || !payLogoUrl || symbolLogoUrl === payLogoUrl) return
    setLogoFallbackMap((prev) => ({ ...prev, [key]: true }))
  }

  const filterSearchFn = (value: string) => {
    const str = value.replace(/\s*/g, '')
    const reg = new RegExp(str.toLowerCase())
    const copy = coinGroups.map((item) => ({
      ...item,
      options: (item.options || []).filter((i) => i.symbol && reg.test(String(i.symbol).toLowerCase())),
    }))
    setCopyCoinList(copy)
  }

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    if (searchThrottleRef.current) clearTimeout(searchThrottleRef.current)
    searchThrottleRef.current = setTimeout(() => filterSearchFn(value), 500)
  }

  const applyCoupon = async () => {
    if (!cartId || !discountCode) return
    setCouponCancelDisabled(false)
    showLoading()
    try {
      await api.useCoupons(cartId, discountCode)
      await cartsTotals()
      setCouponError('')
      setCouponSuccess(true)
      if (shipping.countryId) {
        await refreshShippingAndPayment(shipping, sessionStorage.getItem('shippingMethodRadio') || '')
      }
    } catch (error: any) {
      setCouponError(error?.message || 'Invalid coupon')
      setCouponSuccess(false)
    } finally {
      hideLoading()
    }
  }

  const cancelCoupon = async () => {
    if (!cartId || couponCancelDisabled) return
    showLoading()
    try {
      await api.deleteCoupons(cartId)
      setDiscountCode('')
      setCouponSuccess(false)
      setCouponCancelDisabled(false)
      await cartsTotals()
      if (shipping.countryId) {
        await refreshShippingAndPayment(shipping, sessionStorage.getItem('shippingMethodRadio') || '')
      }
    } catch (error: any) {
      showToast(error?.msg || error?.message || 'Error')
    } finally {
      hideLoading()
    }
  }

  const resolveSubmitMethod = () => {
    if (isFree) return 'free'
    if (['alipay_cryptopay_cn', 'alipay_cryptopay_hk'].includes(radioPayment)) return 'alipay_cryptopay'
    if (radioPayment === 'binancepay_cryptopay') return 'binancepay_cryptopay'
    if (radioPayment === 'paypal_express') return 'paypal_express'
    return 'safepalpay_cryptopay'
  }

  const placeOrder = async () => {
    if (!cartId || paying || orderHaved) return
    if (radioPayment === 'paypal_express' && !isFree) return
    if (!canPayNow && !isFree) return

    setPaying(true)
    showLoading()
    try {
      if (isFree || radioPayment === 'safepalpay_cryptopay') {
        await payInCrypto()
        return
      }

      if (
        radioPayment === 'binancepay_cryptopay' ||
        radioPayment === 'alipay_cryptopay_cn' ||
        radioPayment === 'alipay_cryptopay_hk'
      ) {
        await payInBinanceOrAliPay()
        return
      }
    } catch (error: any) {
      if (error?.refreshSessinId) return
      showToast(error?.message || error?.msg || 'Payment failed')
      if (error?.code === 4001) {
        const entityId = sessionStorage.getItem('entityId') || orderHaved
        if (entityId) navigate(`/order/detail/${entityId}`)
      }
    } finally {
      setPaying(false)
      hideLoading()
    }
  }

  const payInCrypto = async () => {
    if (!cartId) return
    if (!isFree) {
      if (!requireWallet() || !resolveSessionId()) {
        showToast(t('home.sign_in_wallet'))
        return
      }
      if (!hasSelectToken) {
        showToast(t('payment.please_select_coin') || t('common.please_select_coin'))
        return
      }
    }

    const method = isFree ? 'free' : 'safepalpay_cryptopay'
    const paramPayInf = {
      cartId,
      paymentMethod: { method },
      email: shipping.email,
    }
    await api.setPaymentInformation(cartId, paramPayInf)
    const param = buildPaymentPayload(cartId, shipping.email, method, shipping, cartsTotal)
    const res: any = await api.paymentInformation(cartId, param)
    if (res?.refreshSessinId) throw res

    const entityId = res?.entity_id || res
    markOrderCreated(entityId)
    await clearCartAfterOrder()

    if (isFree) {
      navigate(`/order/detail/${entityId}`)
      return
    }

    const coin = selectedCoin
    const { chainId, currentAccount } = wallet || {}
    if (coin.chainId || coin.chain_id) {
      setNetAssign(String(coin.chainId || coin.chain_id))
      setNetValue(coin)
    }

    const walletPayNewOrderParam = {
      order_id: entityId,
      customer_name: `${shipping.lastName || ''} ${shipping.firstName || ''}`.trim(),
      customer_email: shipping.email,
      symbol: coin.symbol,
      coin_price: coin.coinPrice,
      token_amount: coin.tokenAmount,
      offer_time: coin.offerTime,
      code: coin.code,
      chain_id: chainId,
      wallet_address: currentAccount,
    }
    try {
      const result: any = await api.walletPayNewOrder(walletPayNewOrderParam)
      if (result?.refreshSessinId) throw result

      const {
        order: { poolAddress, amount, symbol, outOrderNo, chainId: payChainId, network },
        evmToken: { contractAddress, contractDecimals, nativeToken },
      } = result

      const data = {
        from: currentAccount,
        to: poolAddress,
        symbol,
        amount,
        contractAddress,
        contractDecimals,
        nativeToken,
      }

      await sendWalletTrans(
        data,
        { outOrderNo, chainId: payChainId, network, symbol, entityId },
        {
          wallet: wallet || {},
          isSolana,
          isTron,
          onSuccess: (id) => navigate(`/order/detail/${id}`),
          onCancelToDetail: (id) => navigate(`/order/detail/${id}`),
          t: (key) => String(t(key)),
        },
      )
    } finally {
      setCryptoCountdownActive(false)
    }
  }

  const payInBinanceOrAliPay = async () => {
    if (!cartId) return
    const method = resolveSubmitMethod()
    const paramPayInf = {
      cartId,
      paymentMethod: { method },
      email: shipping.email,
    }
    await api.setPaymentInformation(cartId, paramPayInf)
    const param = buildPaymentPayload(cartId, shipping.email, method, shipping, cartsTotal)
    const res: any = await api.paymentInformation(cartId, param)
    if (res?.refreshSessinId) throw res

    const entityId = res?.entity_id || res
    markOrderCreated(entityId)
    await clearCartAfterOrder()

    if (radioPayment === 'binancepay_cryptopay') {
      await openBinanceCheckout(String(entityId))
      return
    }
    await openAlipayCheckout(String(entityId), radioPayment)
  }

  const clickCoinItem = (item: any) => {
    setSelectedCoin(item)
    if (item?.chainId || item?.chain_id) {
      setNetAssign(String(item.chainId || item.chain_id))
      setNetValue(item)
    }
    setSelectTokenOpen(false)
    setSearchText('')
  }

  const subtotalNode = (
    <PriceValue
      base={cartsTotal?.base_subtotal}
      original={cartsTotal?.subtotal}
    />
  )

  const grandTotalNode = hasZheDiscount ? (
    <>
      ${displayGrandTotal}
      <span style={{ fontSize: 12, marginLeft: 4, color: '#FF453A', textDecoration: 'line-through' }}>
        (${base_grand_total})
      </span>
    </>
  ) : (
    <>
      ${base_grand_total}
      {grand_total !== base_grand_total ? (
        <span style={{ fontSize: 12, marginLeft: 4, color: '#FF453A', textDecoration: 'line-through' }}>
          (${grand_total})
        </span>
      ) : null}
    </>
  )

  return (
    <div className="order-summary page-container">
      <div className="summary-item">
        <div className="title">{t('payment.order_summary')}</div>
        <div className="content">
          <div className="content-item">
            <p className="title">{t('payment.cart_subtotal')}</p>
            <p className="value">{subtotalNode}</p>
          </div>
          {hasZheDiscount ? (
            <div className="content-item">
              <p className="title">{t('payment.discount')}</p>
              <p className="result value">-${zheDiscountAmount}</p>
            </div>
          ) : null}
          {cartsTotal?.coupon_code && cartsTotal?.base_discount_amount ? (
            <div className="content-item">
              <p className="title">
                {t('payment.discount')}({cartsTotal.coupon_code})
              </p>
              <p className="result value">-${Math.abs(Number(cartsTotal.base_discount_amount) || 0)}</p>
            </div>
          ) : null}
          <div className="content-item">
            <div>
              <p className="title">{t('payment.shipping')}</p>
              <p className="title">{estimateShippingText}</p>
            </div>
            <p className="value">${shippingSelect.value ?? 0}</p>
          </div>
          <div className="content-item">
            <p className="title">{t('payment.total_amount')}</p>
            <p className="value">{grandTotalNode}</p>
          </div>
        </div>
      </div>

      <div className="summary-item shopping-list">
        <div className="title">{t('payment.item_in_cart')}</div>
        <Divider style={{ borderColor: '#E1E0EC', margin: 0 }} />
        <div className="list">
          {showList.map((item, index) => (
            <div key={item.item_id ?? index} className="list-item">
              <div className="list-item-box">
                <div className="item-image">
                  <img src={`https://static.isafepal.com/mshop/dev/${item.sku}.png`} alt="" />
                </div>
                <div className="item-content">
                  <div className="item-title">{item.name}</div>
                  <div className="item-qty">
                    {t('common.QTY')}:{item.qty}
                  </div>
                  <div className="item-price">
                    {t('payment.price')}: ${item.price}
                  </div>
                </div>
              </div>
              {index !== showList.length - 1 ? <Divider style={{ borderColor: '#E1E0EC', margin: 0 }} /> : null}
            </div>
          ))}
        </div>
        <Divider style={{ borderColor: '#E1E0EC', margin: 0 }} />
        <div className="total">
          <div className="text">{t('payment.subtotal')}:</div>
          <div className="price">{subtotalNode}</div>
        </div>
      </div>

      <div className="summary-item ship-to">
        <div className="title">
          <h3>{t('payment.ship_to')}</h3>
          <Link to={addressPath} replace>
            <img src={EDIT_ICON} alt="edit" />
          </Link>
        </div>
        <div className="content">
          <p>
            {shipping.lastName} {shipping.firstName}
          </p>
          <p>{shipping.email}</p>
          <p>
            <a href={`tel:${shipping.phoneNumber}`}>{shipping.phoneNumber}</a>
          </p>
          <p>
            {shipping.street},{shipping.city},{shipping.province},{shipping.country}
          </p>
        </div>
      </div>

      <div className="summary-item shipping-method">
        <div className="title">
          <h3>{t('payment.shipping_method')}</h3>
          <Link to={addressPath} replace>
            <img src={EDIT_ICON} alt="edit" />
          </Link>
        </div>
        <div className="content">
          <p>{estimateShippingText}</p>
        </div>
      </div>

      <div className="summary-item discount-code">
          <div className="title">{t('payment.coupon_code')}:</div>
          <div className="content">
            <div className="input-box">
              <Input
                className="ltr-field"
                value={discountCode}
                onChange={(v) => {
                  setDiscountCode(v)
                  if (!v) setCouponError('')
                }}
                placeholder={t('payment.enter_discount_code')}
                disabled={Boolean(cartsTotal?.coupon_code)}
              />
              {cartsTotal?.coupon_code ? (
                <Button className="btn-apply" disabled={couponCancelDisabled} onClick={cancelCoupon}>
                  {t('common.cancel')}
                </Button>
              ) : (
                <Button className="btn-apply" disabled={!canPayNow} onClick={applyCoupon}>
                  {t('payment.apply')}
                </Button>
              )}
            </div>
          </div>
          {couponError ? (
            <div className="error-tips">
              <CloseCircleFill fontSize={16} color="#FF453A" />
              <p>{couponError}</p>
            </div>
          ) : null}
          {couponSuccess ? (
            <div className="success-tip">
              <CheckCircleFill fontSize={16} color="#2DCC47" />
              <p>{t('payment.coupon_code_successfully_applied')}</p>
            </div>
          ) : null}
          {couponNotFreeShipping ? (
            <div className="not-free-shipping">
              <p>{t('payment.coupon_is_not_applicable')}</p>
            </div>
          ) : null}
        </div>

      <div className="summary-item order-total-discount">
        {isFree ? (
          <div className="is-free">
            <p>{t('payment.no_payment_information_required')}</p>
          </div>
        ) : null}
        {hasZheDiscount ? (
          <div className="order-total">
            <div className="text">{t('payment.discount')}</div>
            <div className="result">-${zheDiscountAmount}</div>
          </div>
        ) : null}
        {cartsTotal?.coupon_code && cartsTotal?.base_discount_amount ? (
          <div className="order-total">
            <div className="text">
              {t('payment.discount')}({cartsTotal.coupon_code})
            </div>
            <div className="result">-${Math.abs(Number(cartsTotal.base_discount_amount) || 0)}</div>
          </div>
        ) : null}
        <div className="order-total">
          <div className="text">{t('order.order_total')}</div>
          <div className="result">{grandTotalNode}</div>
        </div>
      </div>

      <PaymentMethods
        methods={paymentMethods}
        value={radioPayment}
        loading={paymentMethodsLoading}
        disabled={!!orderHaved}
        onChange={(code) => setRadioPayment(code)}
      />

      {showCryptoPanel || (orderHaved && radioPayment === 'safepalpay_cryptopay' && !isFree) ? (
        <div className="payment-method">
          <div className="title">
            <div className="text" style={{ marginRight: 5 }}>
              {t('payment.payment_method')}
            </div>
            {cryptoCountdownActive && !orderHaved ? (
              <div className="count-down">({countDownSec}s)</div>
            ) : null}
          </div>
          <div className="content">
            {!isSolana && !isTron && !orderHaved ? (
              <>
                <div className="pay-cell" onClick={() => setSelectNetOpen(true)} role="button" tabIndex={0}>
                  <div className="pay-cell-title">{t('common.network')}:</div>
                  <div className="network-cell">
                    {netValue?.icon ? <img className="images" src={netValue.icon} alt="" /> : null}
                    <div className="network">{netValue?.title || ''}</div>
                    <div className="arrow">
                      <RightOutline fontSize={12} />
                    </div>
                  </div>
                </div>
                <Divider style={{ borderColor: '#E1E0EC', margin: 0 }} />
              </>
            ) : null}
            <div
              className={`pay-cell${selectTokenIsHasChange && hasSelectToken ? ' switch-color' : ''}`}
              onClick={() => {
                if (orderHaved || coinLoading || !shippingMethods.length) return
                setSelectTokenOpen(true)
              }}
              role="button"
              tabIndex={0}
            >
              <div className="pay-cell-title">Coin:</div>
              {hasSelectToken ? (
                <div className="coin">
                  <div className="icon">
                    <img
                      src={resolveTokenLogoUrl(
                        selectedCoin.symbol,
                        selectedCoin.logoUrl,
                        `selected-${selectedCoin.symbol || ''}-${selectedCoin.logoUrl || ''}`,
                      )}
                      onError={() =>
                        handleTokenLogoError(
                          selectedCoin.symbol,
                          selectedCoin.logoUrl,
                          `selected-${selectedCoin.symbol || ''}-${selectedCoin.logoUrl || ''}`,
                        )
                      }
                      alt=""
                    />
                  </div>
                  <div className="text">{selectedCoin.symbol}</div>
                  <div className="arrow">
                    <RightOutline fontSize={12} />
                  </div>
                </div>
              ) : (
                <div className="coin">
                  <div className="text" style={{ color: 'rgb(168, 171, 178)' }}>
                    {t('payment.please_select_coin')}
                  </div>
                  <div className="arrow">
                    <RightOutline fontSize={12} />
                  </div>
                </div>
              )}
            </div>
            {hasSelectToken ? (
              <>
                <Divider style={{ borderColor: '#E1E0EC', margin: 0 }} />
                <div className="pay-cell">
                  <div className="pay-cell-title">{t('order.payment_amount')}:</div>
                  <div className="amount">
                    <p>
                      {dealTokenAmount(selectedCoin.tokenAmount)}
                      <span style={{ paddingLeft: 3 }}>{selectedCoin.symbol}</span>
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {showPayBtn && !orderHaved ? (
        <div className="pay-now btn-submit">
          <Button
            className="btn-pay"
            block
            color="primary"
            loading={paying}
            disabled={!canPayNow && !isFree}
            onClick={placeOrder}
          >
            {isFree ? t('checkout.next') : t('payment.pay_now')}
          </Button>
        </div>
      ) : null}
      {showPayBtn && orderHaved ? (
        <div className="pay-now btn-submit">
          <Button className="btn-pay" block color="primary" onClick={toOrderDetail}>
            {t('order.my_order')}
          </Button>
        </div>
      ) : null}

      <Popup
        visible={selectTokenOpen}
        onMaskClick={() => {
          setSelectTokenOpen(false)
          setSearchText('')
        }}
        onClose={() => {
          setSelectTokenOpen(false)
          setSearchText('')
        }}
        position="bottom"
        className="select-token-popup"
        bodyClassName="select-token-popup"
        bodyStyle={{
          height: coinsLength > 5 ? '70%' : '60%',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      >
        <div className="select-content">
          <div className="top-title">
            <span className="left" />
            <span className="title">{t('payment.select_coin')}</span>
            <span
              onClick={() => {
                setSelectTokenOpen(false)
                setSearchText('')
              }}
              role="button"
              tabIndex={0}
            >
              <CloseOutline fontSize={20} />
            </span>
          </div>
          {coinsLength >= 5 ? (
            <div className="search-box">
              <SearchOutline className="search-icon" fontSize={16} color="#999" />
              <Input
                value={searchText}
                onChange={handleSearchChange}
                placeholder={t('payment.search_name_ticker')}
              />
            </div>
          ) : null}
          <div className="select-box" style={{ overflowY: 'scroll' }}>
            <div className="select-box-content">
              {copyCoinList.map((item) => (
                <div key={item.label}>
                  {item.options?.length ? (
                    <div className="label-title">
                      <p className={!item.disable ? 'token-type-text token-able-text text-4' : 'token-disable-text'}>
                        {tokenListText[item.label] || item.label}
                      </p>
                      {!item.disable ? (
                        <p className="token-type-text token-able-text text-4">{t('payment.balance')}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {(item.options || []).map((p, index) => (
                    <div
                      key={`${p.symbol}_${index}`}
                      className={`select-item${item.disable ? ' cursor-not-allowed item-disable' : ' cursor-pointer'}`}
                      onClick={() => {
                        if (item.disable) return
                        clickCoinItem(p)
                      }}
                    >
                      <div className="item-left">
                        <div className="item-ckecked-icon">
                          <CheckCircleFill
                            fontSize={18}
                            color={selectedCoin?.symbol === p.symbol ? '#4a21ef' : '#CAC9D8'}
                          />
                        </div>
                        <div className={`images${item.disable ? ' images-disable' : ''}`}>
                          <img
                            src={resolveTokenLogoUrl(p.symbol, p.logoUrl, `list-${p.symbol || ''}-${p.logoUrl || ''}`)}
                            onError={() =>
                              handleTokenLogoError(p.symbol, p.logoUrl, `list-${p.symbol || ''}-${p.logoUrl || ''}`)
                            }
                            alt=""
                            style={{ width: 24, height: 24, verticalAlign: 'middle' }}
                          />
                        </div>
                        <div className="title">
                          <p style={{ color: item.disable ? '#a8abb2' : '#12151A', fontSize: 14, lineHeight: '14px' }}>
                            {p.symbol}
                          </p>
                        </div>
                      </div>
                      <div className="item-right">
                        <p
                          className="value text-right"
                          style={{ color: item.disable ? '#a8abb2' : '#12151A', fontSize: 14 }}
                        >
                          {p.balance}
                        </p>
                        <p
                          className="text-right"
                          style={{ color: item.disable ? '#a8abb2' : '#848D99', fontSize: 12, textAlign: 'right' }}
                        >
                          ≈ ${p.balanceInUSD}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Popup>

      <SwitchNet
        visible={selectNetOpen}
        onClose={() => setSelectNetOpen(false)}
      />
    </div>
  )
}
