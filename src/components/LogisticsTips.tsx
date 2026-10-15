import { useTranslation } from 'react-i18next'
import { Divider, Radio } from 'antd-mobile'
import './LogisticsTips.less'

export type ShippingMethod = {
  method_code: string
  carrier_code: string
  method_title?: string
  carrier_title?: string
  amount?: number
  base_amount?: number
  price_incl_tax?: number
}

type Props = {
  methods: ShippingMethod[]
  value: string
  onChange: (methodCode: string) => void
  hideOptions?: boolean
}

function textConvert(target: string | undefined, key: string, value: string) {
  if (!target) return target || ''
  return target.replace(key, value)
}

export default function LogisticsTips({ methods, value, onChange, hideOptions }: Props) {
  const { t } = useTranslation()

  const shippingMethodsText: Record<string, string> = {
    'Standard Shipping': t('common.standard_shipping'),
    'Express Delivery': t('common.express_delivery'),
  }

  if (hideOptions) return null

  return (
    <div className="shipping-methods logistics-tips">
      <div className="title-box">
        <h3 className="title">{t('checkout.shipping_methods')}</h3>
        <Divider className="address-divider" />
      </div>
      <div className="content-box">
        {methods.length ? (
          <div className="content">
            <Radio.Group value={value} onChange={(v) => onChange(String(v))}>
              {methods.map((item) => (
                <Radio
                  key={item.method_code}
                  value={item.method_code}
                  className={`radio${value === item.method_code ? ' actived' : ''}`}
                  style={{
                    '--icon-size': '20px',
                    '--font-size': '14px',
                    '--gap': '8px',
                  }}
                >
                  <div className="radio-text">
                    <div className="left">
                      <p className="price">
                        <span className="amount">${item.amount ?? item.price_incl_tax ?? 0}</span>
                      </p>
                      <p className="text">
                        {shippingMethodsText[item.carrier_title || ''] || item.carrier_title}
                      </p>
                    </div>
                    <div className="right">
                      {textConvert(item.method_title, 'Days', t('common.days')) || item.method_title}
                    </div>
                  </div>
                </Radio>
              ))}
            </Radio.Group>
          </div>
        ) : (
          <div className="content">
            <p
              dangerouslySetInnerHTML={{
                __html: t('checkout.shipping_channels_to_your_address'),
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function localizeShippingText(title: string | undefined, t: (k: string) => string) {
  if (!title) return ''
  const map: Record<string, string> = {
    'Standard Shipping': t('common.standard_shipping'),
    'Express Delivery': t('common.express_delivery'),
    Days: t('common.days'),
  }
  let result = title
  Object.keys(map).forEach((key) => {
    if (result.indexOf(key) !== -1) {
      result = result.replace(key, map[key])
    }
  })
  return result
}

export function getShippingMethodLabel(method: ShippingMethod | undefined, t: (k: string) => string) {
  if (!method) return ''
  const raw = method.method_title || method.carrier_title || t('payment.shipping')
  return localizeShippingText(raw, t)
}

export function findShippingMethod(methods: ShippingMethod[], code: string) {
  return methods.find((m) => m.method_code === code)
}
