import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Divider, Tag } from 'antd-mobile'
import { RightOutline } from 'antd-mobile-icons'
import { api } from '@/api'
import { useWalletStore } from '@/stores/wallet'
import { resolveSessionId } from '@/stores/session'
import { requireWallet } from '@/components/WalletGuard'
import { shouldAutoRestoreWallet } from '@/hooks/useRestoreWalletLogin'
import { localizeShippingText } from '@/components/LogisticsTips'
import NetErrorTips from '@/components/NetErrorTips'
import SwitchNet from '@/components/SwitchNet'
import { formatUtc } from '@/lib/common.js'
import { netWorkList } from '@/lib/connectWallet.js'
import { sendWalletTrans } from '@/lib/payHelpers'
import { showLoading, hideLoading, showToast } from '@/lib/tips'
import './Detail.less'

const COPY_ICON = '/images/icon-copy.svg'
const SUPPORT_URL = 'https://safepalsupport.zendesk.com/hc/en-us/requests/new'

const SKU_NAME_KEYS: Record<string, string> = {
  S1: 's1.safepal_s1_hardware_wallet',
  X1: 'x1.safepal_x1_hardware_wallet',
  'X1-C': 'x1.safepal_x1c_hardware_wallet',
  'X1-BK': 'x1.safepal_x1_hardware_wallet',
  S1P: 's1p.safepal_s1_pro_hardware_wallet',
  CY: 'cy.safepal_cypher_seed_board',
  LC: 'lc.safepal_leather_case',
}

function htmlUnescape(html?: string) {
  if (!html) return ''
  return html.replace(/&lt;|&gt;|&quot;|&amp;/g, (match) => {
    switch (match) {
      case '&lt;':
        return '<'
      case '&gt;':
        return '>'
      case '&quot;':
        return '"'
      case '&amp;':
        return '&'
      default:
        return match
    }
  })
}

function utcTimeAddSpace(value?: string) {
  if (!value) return []
  const index = value.indexOf('(UTC)')
  if (index > -1) {
    return [value.substring(0, index), value.substring(index)]
  }
  return [value]
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

function resolvePayLogoUrl(logoUrl?: string) {
  const url = `${logoUrl || ''}`.trim()
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `https://pay.safepal.com${url.startsWith('/') ? '' : '/'}${url}`
}

function dealTronNetworkName(value?: string) {
  if (!value) return value || ''
  const matches = value.match(/\((.*?)\)/)
  return matches ? matches[1] : value
}

function resolveDisplayNetworkName(sppChainId?: string | number, sppNetwork?: string) {
  const chainId = `${sppChainId ?? ''}`
  if (chainId === '-98') {
    return dealTronNetworkName(sppNetwork) || sppNetwork || ''
  }
  if (chainId === '-99') {
    return sppNetwork || 'Solana'
  }
  const matched = netWorkList.find((item: any) => `${item.value}` === chainId)
  return matched?.title || sppNetwork || ''
}

function money(value: any) {
  return (Number(value) || 0).toFixed(2)
}

function textConvert(target: string | undefined, key: string, value: string) {
  if (!target) return target || ''
  return target.replace(key, value)
}

function computeOrderExpireMs(
  showOrderStatusCode: number,
  payMethodCode: string,
  sppExpireTimestamp?: number,
  orderExpireTime?: number,
) {
  if (showOrderStatusCode !== 200) return 0
  if (payMethodCode === 'safepalpay_cryptopay') {
    return (Number(sppExpireTimestamp) || 0) * 1000 - Date.now()
  }
  return ((Number(orderExpireTime) || 0) + 8 * 60 * 60) * 1000 - Date.now()
}

function resolveStoredCheckout(payMethodCode: string) {
  if (payMethodCode === 'safepalpay_cryptopay') {
    return { showPayBtn: true }
  }
  return { showPayBtn: false }
}

function formatCountdown(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function resolveNetworkMismatchMessage(
  orderDetails: any,
  t: (key: string) => string,
) {
  const sppChainId = `${orderDetails.spp_chain_id}`
  let networkName: string

  if (sppChainId === '-99') {
    networkName = 'Solana'
  } else if (sppChainId === '-98') {
    networkName = dealTronNetworkName(orderDetails.spp_network) || 'TRON(TRC20)'
  } else {
    const index = netWorkList.findIndex((item: any) => `${item.value}` === sppChainId)
    networkName =
      index > -1
        ? netWorkList[index].title
        : dealTronNetworkName(orderDetails.spp_network) || orderDetails.spp_network
  }

  return String(t('order.switch_to_net')).replace('{0}', networkName)
}

export default function OrderDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const wallet = useWalletStore((s) => s.wallet)
  const [details, setDetails] = useState<any>({})
  const [items, setItems] = useState<any[]>([])
  const [billingAddress, setBillingAddress] = useState<any>({})
  const [shippingDescription, setShippingDescription] = useState('')
  const [showOrderStatusCode, setShowOrderStatusCode] = useState<number | null>(null)
  const [hasLoad, setHasLoad] = useState(false)
  const [expireEndAt, setExpireEndAt] = useState<number | null>(null)
  const [showPayBtn, setShowPayBtn] = useState(false)
  const [hasClickPay, setHasClickPay] = useState(false)
  const [tick, setTick] = useState(0)
  const [netErrVisible, setNetErrVisible] = useState(false)
  const [netErrMessage, setNetErrMessage] = useState('')
  const [switchNetOpen, setSwitchNetOpen] = useState(false)

  const expireRefreshCountRef = useRef(0)
  const netErrShownRef = useRef(false)
  const prevRemainingRef = useRef<number | null>(null)
  const requestSeqRef = useRef(0)
  const lastAutoFetchKeyRef = useRef('')

  const statusText: Record<string, string> = {
    Completed: t('order.complete'),
    Unpaid: t('order.unpaid'),
    Pending: t('order.pending'),
    Processing: t('order.processing'),
    Delivered: t('order.delivered'),
    Canceled: t('order.canceled'),
    Expired: t('order.expired'),
    Shipped: t('order.shipped'),
  }

  const showNetErrTips = useCallback((message: string) => {
    setNetErrMessage(message)
    setNetErrVisible(true)
    netErrShownRef.current = true
  }, [])

  const checkNetworkMismatch = useCallback(
    (orderDetails: any, statusCode: number | null, chainId?: string | number) => {
      if (!chainId || !orderDetails?.spp_chain_id || statusCode !== 200) return
      if (`${chainId}` === `${orderDetails.spp_chain_id}`) return
      if (netErrShownRef.current) return

      showNetErrTips(resolveNetworkMismatchMessage(orderDetails, t))
    },
    [showNetErrTips, t],
  )

  const loadOrderDetails = useCallback(
    (silent = false) => {
      const sid = resolveSessionId()
      const currentWallet = useWalletStore.getState().wallet
      if (!currentWallet?.currentAccount) {
        if (!sid) {
          requireWallet()
        } else if (!shouldAutoRestoreWallet()) {
          requireWallet()
        }
        return Promise.resolve()
      }
      if (!sid) {
        requireWallet()
        return Promise.resolve()
      }
      if (!id) return Promise.resolve()

      const requestSeq = ++requestSeqRef.current

      if (!silent) {
        setHasLoad(false)
        showLoading()
      }

      return api
        .getOrderDetails({
          order_id: id,
          entity_id: id,
          address: currentWallet.currentAccount,
          chain_id: currentWallet.chainId,
        })
        .then((res: any) => {
          if (requestSeq !== requestSeqRef.current) return
          if (res?.refreshSessinId) {
            navigate('/')
            return
          }

          const list = Array.isArray(res?.items) ? res.items : []
          const statusCode = res?.showOrderStatusCode ?? null
          const payMethodCode = res?.pay_method_code || ''

          setDetails(res || {})
          setItems(list)
          setBillingAddress(res?.billing_address || res?.billingAddress || {})
          setShippingDescription(res?.shipping_description || '')
          setShowOrderStatusCode(statusCode)

          const expireMs = computeOrderExpireMs(
            Number(statusCode),
            payMethodCode,
            res?.spp_expire_time_timestamp,
            res?.order_expire_time,
          )
          setExpireEndAt(expireMs > 0 ? Date.now() + expireMs : null)

          const checkout = resolveStoredCheckout(payMethodCode)
          setShowPayBtn(checkout.showPayBtn)
        })
        .catch((error: any) => {
          if (requestSeq !== requestSeqRef.current) return
          showToast(error?.msg || error?.message || 'Error')
        })
        .finally(() => {
          if (!silent) hideLoading()
          if (requestSeq !== requestSeqRef.current) return
          setHasLoad(true)
        })
    },
    [id, navigate],
  )

  const expireTimeFinish = useCallback(() => {
    if (expireRefreshCountRef.current < 2) {
      expireRefreshCountRef.current += 1
      loadOrderDetails(true)
    }
  }, [loadOrderDetails])

  useEffect(() => {
    const isReload = sessionStorage.getItem('isReload')
    if (isReload) {
      sessionStorage.removeItem('isReload')
      window.location.reload()
    }
  }, [])

  useEffect(() => {
    const account = wallet?.currentAccount
    if (!id || !account) {
      lastAutoFetchKeyRef.current = ''
      loadOrderDetails()
      return
    }

    if (!resolveSessionId()) {
      loadOrderDetails()
      return
    }

    const fetchKey = `${id}:${account}`
    if (lastAutoFetchKeyRef.current === fetchKey) return
    lastAutoFetchKeyRef.current = fetchKey

    netErrShownRef.current = false
    expireRefreshCountRef.current = 0
    prevRemainingRef.current = null
    loadOrderDetails()
  }, [id, wallet?.currentAccount, loadOrderDetails])

  useEffect(() => {
    netErrShownRef.current = false
    setNetErrVisible(false)
  }, [wallet?.chainId])

  useEffect(() => {
    return () => {
      setNetErrVisible(false)
    }
  }, [])

  useEffect(() => {
    if (
      !hasLoad ||
      details.pay_method_code !== 'safepalpay_cryptopay' ||
      showOrderStatusCode !== 200 ||
      !wallet?.chainId
    ) {
      return
    }
    checkNetworkMismatch(details, showOrderStatusCode, wallet.chainId)
  }, [
    hasLoad,
    details.pay_method_code,
    details.spp_chain_id,
    showOrderStatusCode,
    wallet?.chainId,
    checkNetworkMismatch,
  ])

  useEffect(() => {
    if (!expireEndAt) return undefined
    const timer = window.setInterval(() => setTick((v) => v + 1), 1000)
    return () => window.clearInterval(timer)
  }, [expireEndAt])

  const remainingMs = expireEndAt ? Math.max(0, expireEndAt - Date.now()) : 0
  void tick

  useEffect(() => {
    if (prevRemainingRef.current === null) {
      prevRemainingRef.current = remainingMs
      return
    }
    if (prevRemainingRef.current > 0 && remainingMs === 0 && showOrderStatusCode === 200) {
      expireTimeFinish()
    }
    prevRemainingRef.current = remainingMs
  }, [remainingMs, showOrderStatusCode, expireTimeFinish])

  const showPayBar = showOrderStatusCode === 200 && showPayBtn && remainingMs > 0
  const needBottomPadding = showOrderStatusCode === 200

  useEffect(() => {
    const el = document.getElementById('back-to-top')
    if (!el) return undefined
    el.style.bottom = '80px'
    return () => {
      el.removeAttribute('style')
    }
  }, [])

  const payNow = async () => {
    if (!wallet?.currentAccount || hasClickPay) return

    const {
      spp_pool_address,
      spp_token_amount,
      spp_coin_symbol,
      spp_chain_id,
      spp_network,
      spp_token_contract_address,
      spp_token_contract_decimals,
      spp_flag_native_token,
      increment_id,
      pay_method_code,
      entity_id,
    } = details

    try {
      setHasClickPay(true)

      if (pay_method_code === 'safepalpay_cryptopay') {
        if (`${wallet.chainId}` !== `${spp_chain_id}`) {
          netErrShownRef.current = false
          checkNetworkMismatch(details, showOrderStatusCode, wallet.chainId)
          return
        }

        const payIsSolana = `${spp_chain_id}` === '-99'
        const payIsTron = `${spp_chain_id}` === '-98'
        const data = {
          from: wallet.currentAccount,
          to: spp_pool_address,
          symbol: spp_coin_symbol,
          amount: spp_token_amount,
          contractAddress: spp_token_contract_address,
          contractDecimals: spp_token_contract_decimals,
          nativeToken: spp_flag_native_token === '1',
        }
        const orderEntityId = entity_id || id
        await sendWalletTrans(
          data,
          {
            outOrderNo: increment_id,
            chainId: spp_chain_id,
            network: spp_network,
            symbol: spp_coin_symbol,
            entityId: orderEntityId,
          },
          {
            wallet: wallet || {},
            isSolana: payIsSolana,
            isTron: payIsTron,
            onSuccess: () => {
              navigate(`/order?transaction_no=${increment_id}`)
            },
            onCancelToDetail: () => {
              setHasClickPay(false)
            },
            t: (key) => String(t(key)),
          },
        )
        return
      }
    } catch (error: any) {
      const code = error?.code
      if (code !== 4001 && code !== 'ACTION_REJECTED' && !error?.isCancel) {
        const message = error?.message || error?.errorMessage || error?.msg
        if (message) showToast(message)
      }
      if (error?.code === 7000004) {
        await loadOrderDetails(true)
      }
    } finally {
      setHasClickPay(false)
    }
  }

  const showItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      name: SKU_NAME_KEYS[item.sku] ? t(SKU_NAME_KEYS[item.sku]) : item.name,
    }))
  }, [items, t])

  const isFree = Number(details.grand_total) === 0

  const shippingMethodParts = useMemo(() => {
    const desc = shippingDescription || ''
    const dashIndex = desc.indexOf('-')
    return {
      name: dashIndex > -1 ? desc.substring(0, dashIndex) : desc,
      value: dashIndex > -1 ? desc.substring(dashIndex + 1) : '',
    }
  }, [shippingDescription])

  const showShippingMethodByLang = useMemo(() => {
    const map: Record<string, string> = {
      'Standard Shipping': t('common.standard_shipping'),
      'Express Delivery': t('common.express_delivery'),
    }
    const target = typeof shippingMethodParts.name === 'string' ? shippingMethodParts.name.trim() : shippingMethodParts.name
    return map[target] || localizeShippingText(target, t) || target
  }, [shippingMethodParts.name, t])

  const showShippingMethodValueByLang = useMemo(() => {
    const raw = shippingMethodParts.value
    return textConvert(raw, 'Days', t('common.days')) || raw
  }, [shippingMethodParts.value, t])

  const doCopy = async (value?: string) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(String(value))
      showToast(t('order.copied_success'))
    } catch (error: any) {
      showToast(error?.msg || error?.message || 'Error')
    }
  }

  const statusLabel = statusText[details.showOrderStatusDesc] || details.showOrderStatusDesc
  const isCryptoPay = details.pay_method_code === 'safepalpay_cryptopay'
  const showExpire =
    showOrderStatusCode !== null && [200, -200].includes(Number(showOrderStatusCode))

  return (
    <div className={`order-detail page-container${needBottomPadding ? ' paddingB80' : ''}`}>
      <div className="title-status">
        <div className="title">{t('order.order_detail')}</div>
        <div className="status">
          <Tag color="primary" fill="outline">
            {statusLabel}
          </Tag>
        </div>
      </div>

      <div className="detail-item shopping-list">
        <div className="title">{t('order.shopping_list')}:</div>
        <Divider
          style={{
            borderColor: '#E1E0EC',
            margin: 0,
            borderStyle: 'solid',
          }}
        />
        <div className="list">
          {showItems.map((item, index) => (
            <div key={item.item_id ?? index} className="list-item">
              <div className="list-item-box">
                <div className="item-image">
                  <img
                    src={`https://static.isafepal.com/mshop/dev/${item.image || item.sku}`}
                    alt=""
                  />
                </div>
                <div className="item-content">
                  <div className="item-title">{item.name}</div>
                  <div className="item-qty">
                    {t('common.QTY')}: {item.qty}
                  </div>
                  <div className="item-price">${item.price}</div>
                </div>
              </div>
              {index !== showItems.length - 1 ? (
                <Divider
                  style={{
                    borderColor: '#E1E0EC',
                    margin: 0,
                    borderStyle: 'solid',
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
        <Divider
          style={{
            borderColor: '#E1E0EC',
            margin: 0,
            borderStyle: 'solid',
          }}
        />
        <div className="total">
          <div className="text">{t('order.order_total')}</div>
          <div className="price">
            ${money(details.base_subtotal)}
            {details.base_subtotal !== details.subtotal ? (
              <span className="strike-price">(${money(details.subtotal)})</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="detail-item ship-to">
        <div className="title">{t('payment.ship_to')}:</div>
        {hasLoad ? (
          <div className="content">
            <p>
              {htmlUnescape(billingAddress?.firstname)} {htmlUnescape(billingAddress?.lastname)}
            </p>
            <p>{billingAddress?.email}</p>
            <p>{billingAddress?.telephone}</p>
            <p>
              <span>{htmlUnescape(billingAddress?.street)},</span>{' '}
              {`${htmlUnescape(billingAddress?.city)},`}
              {billingAddress?.region ? ` ${htmlUnescape(billingAddress.region)},` : ''}
              {billingAddress?.country_name || billingAddress?.country_id}
            </p>
          </div>
        ) : null}
      </div>

      <div className="detail-item shipping-method">
        <div className="title">{t('payment.shipping_method')}:</div>
        <div className="content">
          <p className="method">
            <span className="method-name">{showShippingMethodByLang}</span>
            <span className="method-amount">${money(details.shipping_amount)}</span>
            <span className="method-value">{showShippingMethodValueByLang}</span>
          </p>
        </div>
      </div>

      <div className="detail-item">
        <div className="order-total">
          <div className="text">
            {t('payment.discount')}
            {details.coupon_code ? (
              <span className="coupon-code">{`(${details.coupon_code})`}</span>
            ) : null}
          </div>
          <div className="result">${money(details.discount_amount)}</div>
        </div>
        <div className="order-total">
          <div className="text">{t('order.order_total')}</div>
          <div className="result">
            ${money(details.base_grand_total)}
            {details.base_grand_total !== details.grand_total ? (
              <span className="strike-price">(${money(details.grand_total)})</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="detail-item order-describe">
        <div className="describe-item">
          <div className="item-label">{t('order.order_no')}:</div>
          <div className="item-value icon-item-value">
            <span className="text">{details.increment_id}</span>
            <span className="my-icon icon-copy" onClick={() => doCopy(details.increment_id)} role="button">
              <img src={COPY_ICON} alt="" />
            </span>
          </div>
        </div>

        <div className="describe-item">
          <div className="item-label">{t('order.create_time')}:</div>
          {!isFree ? (
            <div className="item-value">
              {utcTimeAddSpace(details.created_at).map((part, index) => (
                <span key={index} className={index === 0 ? 'paddingR4' : ''}>
                  {part}
                </span>
              ))}
            </div>
          ) : (
            <div className="item-value">
              <span>{details.created_at}</span>
            </div>
          )}
        </div>

        {!isFree && isCryptoPay ? (
          <div className="describe-item">
            <div className="item-label">{t('order.payment_no')}:</div>
            <div className="item-value icon-item-value">
              <span className="text">{details.spp_payment_no}</span>
              {details.spp_payment_no ? (
                <span
                  className="my-icon icon-copy"
                  onClick={() => doCopy(details.spp_payment_no)}
                  role="button"
                >
                  <img src={COPY_ICON} alt="" />
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="describe-item">
          <div className="item-label">{t('payment.payment_method')}:</div>
          {!isFree ? (
            <div className="item-value icon-item-value">
              {isCryptoPay ? (
                <>
                  {details.spp_coin_logo_url ? (
                    <span className="my-icon coin-logo">
                      <img src={resolvePayLogoUrl(details.spp_coin_logo_url)} alt="" />
                    </span>
                  ) : null}
                  <span>{details.spp_coin_symbol}</span>
                  <span className="network-name">
                    ({resolveDisplayNetworkName(details.spp_chain_id, details.spp_network)})
                  </span>
                </>
              ) : (
                <span>
                  {details.pay_method_code === 'alipay_cryptopay'
                    ? `${details.pay_method_title}(${details.alipay_country})`
                    : details.pay_method_title}
                </span>
              )}
            </div>
          ) : (
            <div className="item-value icon-item-value">
              <span>Free</span>
            </div>
          )}
        </div>

        <div className="describe-item">
          <div className="item-label">{t('order.payment_amount')}:</div>
          {!isFree ? (
            <div className="item-value">
              {isCryptoPay ? (
                <p>
                  {dealTokenAmount(details.spp_token_amount)}
                  <span className="token-symbol">{details.spp_coin_symbol}</span>
                </p>
              ) : (
                <p>
                  ${money(details.base_grand_total)}
                  {details.base_grand_total !== details.grand_total ? (
                    <span className="strike-price">(${money(details.grand_total)})</span>
                  ) : null}
                </p>
              )}
            </div>
          ) : (
            <div className="item-value">
              <p>${money(details.grand_total)}</p>
            </div>
          )}
        </div>

        {details.pay_time ? (
          <div className="describe-item">
            <div className="item-label">{t('order.payment_time')}:</div>
            <div className="item-value">
              <p>
                {utcTimeAddSpace(details.pay_time).map((part, index) => (
                  <span key={index} className={index === 0 ? 'paddingR4' : ''}>
                    {part}
                  </span>
                ))}
              </p>
            </div>
          </div>
        ) : null}

        {isCryptoPay
          ? details.spp_expire_time && showExpire
            ? (
              <div className="describe-item">
                <div className="item-label">{t('order.expire_time')}:</div>
                <div className="item-value">
                  <p>
                    {utcTimeAddSpace(details.spp_expire_time).map((part, index) => (
                      <span key={index} className={index === 0 ? 'paddingR4' : ''}>
                        {part}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              )
            : null
          : details.order_expire_time && showExpire
            ? (
              <div className="describe-item">
                <div className="item-label">{t('order.expire_time')}:</div>
                <div className="item-value">
                  <p>{formatUtc(Number(details.order_expire_time) * 1000)} (UTC)</p>
                </div>
              </div>
              )
            : null}
      </div>

      {details.tracker_no ? (
        <div className="track-order detail-item">
          <div className="describe-item">
            <div className="item-label">{t('order.shipping_time')}:</div>
            <div className="item-value icon-item-value">
              {utcTimeAddSpace(details.delivery_time).map((part, index) => (
                <span key={index} className={index === 0 ? 'paddingR4' : ''}>
                  {part}
                </span>
              ))}
            </div>
          </div>
          <div className="describe-item">
            <div className="item-label">{t('order.tracking_no')} :</div>
            <div className="item-value icon-item-value">
              <span className="text">{details.tracker_no}</span>
              <span className="my-icon icon-copy" onClick={() => doCopy(details.tracker_no)} role="button">
                <img src={COPY_ICON} alt="" />
              </span>
            </div>
          </div>
          <div className="describe-item btn-track">
            <Button
              fill="outline"
              color="primary"
              className="btn-track-order"
              onClick={() => {
                if (details.tracker_url) {
                  window.open(details.tracker_url, '_blank', 'noopener,noreferrer')
                }
              }}
            >
              {t('order.track_my_order')}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="detail-item submit-request">
        <a
          className="describe-item"
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="item-label">{t('order.submit_request')}</div>
          <div className="item-value">
            <RightOutline fontSize={16} />
          </div>
        </a>
      </div>

      {showPayBar ? (
        <div className="tabbar-pay-now">
          <div className="pay-now">
            <div className="expire">
              <p>{t('order.payment_process_will')}</p>
              <div className="count-down-box">
                <p>{t('order.expire_in')}</p>
                <span className="count-down">{formatCountdown(remainingMs)}</span>
              </div>
            </div>
            <div className="btn">
              <Button
                className="btn-pay"
                color="primary"
                disabled={hasClickPay}
                loading={hasClickPay}
                onClick={payNow}
              >
                {t('payment.pay_now')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <NetErrorTips
        visible={netErrVisible}
        message={netErrMessage}
        onClose={() => setNetErrVisible(false)}
        onSwitchNet={() => setSwitchNetOpen(true)}
      />
      <SwitchNet visible={switchNetOpen} onClose={() => setSwitchNetOpen(false)} />
    </div>
  )
}
