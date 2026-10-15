import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from 'antd-mobile'
import { CloseCircleOutline } from 'antd-mobile-icons'
import './index.less'

export default function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="error-page page-container">
      <div className="icon-error">
        <CloseCircleOutline />
      </div>
      <div className="error-content">
        <p>{t('home.page_not_found')}</p>
      </div>
      <div className="back-home">
        <Button className="btn-home" onClick={() => navigate('/')}>
          {t('common.back_to_home')}
        </Button>
      </div>
    </div>
  )
}
