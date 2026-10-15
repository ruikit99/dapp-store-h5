import { Radio } from 'antd-mobile'
import './PaymentMethods.less'

const alipayLogo = '/images/payment/alipay-logo.svg'
const alipayHkLogo = '/images/payment/alipay-hk-logo.svg'
const binanceLogo = '/images/payment/binancepay-logo.svg'
const paypalLogo = '/images/payment/paypal-logo.png'
const cryptoLogo = '/images/payment/group-logo.svg'

export type PaymentMethodItem = {
  code: string
  title?: string
}

type Props = {
  methods: PaymentMethodItem[]
  value: string
  disabled?: boolean
  loading?: boolean
  onChange: (code: string) => void
}

const SKELETON_COUNT = 3

const METHOD_META: Record<string, { label: string; icon?: string; radioName?: string }> = {
  safepalpay_cryptopay: { label: 'Pay in crypto', icon: cryptoLogo, radioName: 'safepalpay_cryptopay' },
  paypal_express: { label: 'Card payment or PayPal', icon: paypalLogo, radioName: 'paypal_express' },
  binancepay_cryptopay: { label: 'Binance Pay', icon: binanceLogo, radioName: 'binancepay_cryptopay' },
  alipay_cryptopay: { label: '支付宝', icon: alipayLogo, radioName: 'alipay_cryptopay_cn' },
  alipay_hk_cryptopay: { label: 'Alipay HK', icon: alipayHkLogo, radioName: 'alipay_cryptopay_hk' },
}

export default function PaymentMethods({ methods, value, disabled, loading, onChange }: Props) {
  if (loading) {
    return (
      <div className="paymentMethods">
        <div className="paymentBox">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <div key={index} className="radioItem">
              <div className="paymentSkeleton" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!methods.length) {
    return null
  }

  return (
    <div className="paymentMethods">
      <div className="paymentBox paymentFadeIn">
        <Radio.Group value={value} onChange={(v) => onChange(String(v))} disabled={disabled}>
          {methods.map((item) => {
            const meta = METHOD_META[item.code] || { label: item.title || item.code, radioName: item.code }
            const radioName = meta.radioName || item.code
            const actived = value === radioName
            return (
              <div key={item.code} id={item.code} className="radioItem">
                <div
                  className={`paymentItem${actived ? ' actived' : ''}`}
                  onClick={() => {
                    if (!disabled) onChange(radioName)
                  }}
                >
                  <Radio value={radioName}>
                    <div className="radioBox">
                      <p className="radioText">{meta.label}</p>
                      {meta.icon ? <img className="paymentIcon" src={meta.icon} alt="" /> : null}
                    </div>
                  </Radio>
                </div>
                {item.code === 'paypal_express' ? (
                  <div id="paypalBox" className="paypalBox" style={{ display: actived ? 'block' : 'none' }} />
                ) : null}
              </div>
            )
          })}
        </Radio.Group>
      </div>
    </div>
  )
}

export { openAlipayCheckout, openBinanceCheckout } from '@/lib/payHelpers'
