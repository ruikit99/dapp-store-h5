import { useTranslation } from 'react-i18next'
import './TrulyDecentralized.less'

export default function TrulyDecentralized() {
  const { t } = useTranslation()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section id="truly-decentralized">
      <div className="truly-decentralized-box">
        <div className="truly-decentralized-container">
          <div className="img">
            <img src="/images/s1pro/truly-decentralized.png" alt="" />
          </div>
          <div className="title">
            <p>{t('s1p.truly_decentralized_way1')}</p>
            <p>{t('s1p.truly_decentralized_way2')}</p>
          </div>
          <div className="order-box">
            <button
              id="truly-decentralized-order-now"
              type="button"
              className="my-btn-truly-order"
              onClick={scrollToTop}
            >
              {t('common.order_now')}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
