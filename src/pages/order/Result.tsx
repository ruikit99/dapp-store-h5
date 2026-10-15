import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from 'antd-mobile'
import './Result.less'

export default function OrderResultPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const status = (params.get('status') || 'pending') as 'success' | 'pending' | 'failed'
  const orderId = params.get('orderId') || sessionStorage.getItem('entityId') || ''

  const title = useMemo(() => {
    if (status === 'success') return t('common.payment_successful') || t('home.payment_processing')
    if (status === 'failed') return t('order.transaction_signature_denied') || t('home.payment_processing')
    return t('home.payment_processing')
  }, [status, t])

  const subtitle = useMemo(() => {
    if (status === 'success') return orderId ? `${t('order.order_no')}: ${orderId}` : ''
    if (status === 'failed') return t('payment.try_again') || ''
    return t('home.broadcasting_transaction')
  }, [status, orderId, t])

  const goOrder = () => {
    if (orderId) navigate(`/order/detail/${orderId}`)
    else navigate('/order')
  }

  return (
    <div className="order-result page-container">
      <div className="result-box">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
        {orderId && status !== 'failed' && (
          <p className="order-id">
            {t('order.order_no')}: {orderId}
          </p>
        )}
        <Button block color="primary" onClick={goOrder}>
          {t('order.order_detail')}
        </Button>
        {status === 'failed' && orderId && (
          <Button block color="primary" fill="solid" onClick={() => navigate(`/order/detail/${orderId}`)}>
            {t('payment.try_again') || t('order.order_detail')}
          </Button>
        )}
        <Button block fill="outline" onClick={() => navigate('/')}>
          {t('common.back_to_home')}
        </Button>
      </div>
    </div>
  )
}
