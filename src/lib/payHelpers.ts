import { api } from '@/api'
import { getCouponHeader } from '@/stores/cart'
import { isAndroid, isIos, isMobile } from '@/lib/env'
import { confirmTransaction } from '@/lib/common.js'
import { rawTransaction } from '@/lib/connectWallet.js'
import { SendSolanaSplTokens } from '@/lib/solanaWeb3.js'
import { sendTRC20Token } from '@/lib/tronTransaction.js'
import { forceHideLoading, localizeCancelledByUserTip, showConfirm, showToast } from '@/lib/tips'

function isUserCancelError(error: any): boolean {
  const code = error?.code
  if (code === 4001 || code === 'ACTION_REJECTED' || code === '4001') return true
  if (error?.isCancel) return true
  const message = String(error?.message || error?.msg || error || '').toLowerCase()
  return (
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('cancelled by user') ||
    message.includes('canceled by user') ||
    message.includes('user cancelled') ||
    message.includes('user canceled')
  )
}

export type ShippingAddr = Record<string, string>

export function buildBillingAddress(shipping: ShippingAddr) {
  const billing: Record<string, any> = {
    region: shipping.province,
    regionCode: shipping.regionCode || shipping.provinceCode || '',
    countryId: shipping.countryId,
    street: [shipping.street],
    company: shipping.company || '',
    postcode: shipping.postalCode,
    city: shipping.city,
    telephone: shipping.phoneNumber,
    firstname: shipping.firstName,
    lastname: shipping.lastName,
    vatId: shipping.taxNumber || '',
  }
  if (shipping.provinceId) billing.regionId = shipping.provinceId
  return billing
}

export function buildPaymentPayload(
  cartId: string,
  email: string,
  method: string,
  shipping: ShippingAddr,
  cartsTotal?: Record<string, any>,
) {
  const param: Record<string, any> = {
    cartId,
    email,
    paymentMethod: { method },
    billingAddress: buildBillingAddress(shipping),
  }
  if (cartsTotal?.base_discount_amount && cartsTotal?.coupon_code) {
    param.extension_attributes = {
      discount_data: {
        amount: cartsTotal.discount_amount,
        base_amount: cartsTotal.base_discount_amount,
        original_amount: cartsTotal.discount_amount,
        base_original_amount: cartsTotal.base_discount_amount,
      },
    }
  }
  return param
}

const FALLBACK_PAYMENT_METHODS = [
  { code: 'safepalpay_cryptopay' },
  { code: 'paypal_express' },
  { code: 'binancepay_cryptopay' },
  { code: 'alipay_cryptopay' },
]

export async function loadPaymentMethodsFromShipping(
  cartId: string,
  countryId?: string,
): Promise<any[]> {
  try {
    const raw = sessionStorage.getItem('paramShippingInf')
    if (!raw) return FALLBACK_PAYMENT_METHODS
    const params = JSON.parse(raw)
    const res: any = await api.shippingInformation(cartId, params, getCouponHeader())
    const paymentMethods = res?.payment_methods?.length
      ? [...res.payment_methods]
      : [...FALLBACK_PAYMENT_METHODS]
    if (countryId && ['CN', 'HK', 'MO'].includes(countryId)) {
      const hasHk = paymentMethods.some((m: any) => m.code === 'alipay_hk_cryptopay')
      if (!hasHk) paymentMethods.push({ code: 'alipay_hk_cryptopay', title: 'AliPay HK' })
    }
    return paymentMethods
  } catch {
    return FALLBACK_PAYMENT_METHODS
  }
}

function openExternalUrl(url: string) {
  const connector = (window as any).safepalConnector
  if (connector?.openUrl) {
    connector.openUrl(url)
    return
  }
  if (isIos()) {
    setTimeout(() => {
      window.location.href = url
    }, 0)
  } else {
    sessionStorage.setItem('isReload', 'true')
    window.location.href = url
  }
}

export async function openAlipayCheckout(orderNo: string, radioPayment: string) {
  const params = {
    p: isMobile() ? 'WAP' : 'WEB',
    o: isIos() ? 'IOS' : isAndroid() ? 'ANDROID' : 'PC',
    a: radioPayment === 'alipay_cryptopay_hk' ? 'HK' : 'CN',
  }
  const result: any = await api.getAlipayByOrder(orderNo, params)
  const parsed = typeof result === 'string' ? JSON.parse(result) : result
  const { status, code, data } = parsed
  if (status === 'SUCCESS' && code === '000000') {
    const targetUrl =
      isIos() || isAndroid() ? data?.applinkUrl || data?.normalUrl : data?.normalUrl
    if (!targetUrl) throw new Error(parsed?.message || 'Alipay URL missing')
    openExternalUrl(targetUrl)
    return targetUrl
  }
  throw new Error(parsed?.message || 'Alipay failed')
}

export async function openBinanceCheckout(orderNo: string) {
  const result: any = await api.getBinancePayByOrder(orderNo)
  const parsed = typeof result === 'string' ? JSON.parse(result) : result
  const { status, code, data } = parsed
  if (status === 'SUCCESS' && code === '000000') {
    const url = data?.checkoutUrl
    if (!url) throw new Error(parsed?.message || 'Binance URL missing')
    openExternalUrl(url)
    return url
  }
  throw new Error(parsed?.message || 'Binance Pay failed')
}

export type SendWalletAssist = {
  outOrderNo: string
  chainId: string | number
  network: string
  symbol: string
  entityId: string | number
}

type SendWalletOpts = {
  wallet: Record<string, any>
  isSolana: boolean
  isTron: boolean
  onSuccess: (entityId: string | number) => void
  onCancelToDetail: (entityId: string | number) => void
  t: (key: string) => string
}

export async function sendWalletTrans(
  dataParm: Record<string, any>,
  assist: SendWalletAssist,
  opts: SendWalletOpts,
): Promise<string> {
  const { chainId, outOrderNo, symbol, network, entityId } = assist
  const { wallet, isSolana, isTron, onSuccess, onCancelToDetail, t } = opts

  const updateConnectedOrder = async (txid: string) => {
    await api.updateConnectedOrder({
      outOrderNo,
      walletAddress: dataParm.from,
      chainId,
      txHash: txid,
      symbol,
      network,
    })
    showToast(t('common.payment_successful'))
    onSuccess(entityId)
    return txid
  }

  try {
    const checkTxidRes: any = await api.checkTxid({ orderId: entityId })
    const { code, msg } = checkTxidRes || {}
    if (code !== 0) throw { message: msg || 'checkTxid failed', code }

    if (isSolana) {
      const txid = await SendSolanaSplTokens(dataParm)
      return updateConnectedOrder(txid)
    }

    if (isTron) {
      const res: any = await sendTRC20Token(dataParm)
      if (res && typeof res === 'object') {
        if (res.code && !res.result) throw { message: res.code }
        return updateConnectedOrder(res.txid)
      }
      throw { message: 'Tron transfer failed' }
    }

    const confirmTransactionToast = confirmTransaction(t('order.confirm_transaction'))
    try {
      const param = await rawTransaction(dataParm)
      const provider = wallet?.provider?.() || (window as any).ethereum
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [param],
      })
      return updateConnectedOrder(txHash)
    } finally {
      confirmTransactionToast.clear()
    }
  } catch (error: any) {
    const message = localizeCancelledByUserTip(error?.message || error?.msg || String(error))
    if (isUserCancelError(error)) {
      forceHideLoading()
      const confirmed = await showConfirm(
        message || t('order.transaction_signature_denied'),
        t('payment.try_again'),
      )
      if (confirmed) return sendWalletTrans(dataParm, assist, opts)
      onCancelToDetail(entityId)
      throw error
    }
    forceHideLoading()
    onCancelToDetail(entityId)
    throw error
  }
}
