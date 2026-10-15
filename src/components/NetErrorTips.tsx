import { useTranslation } from 'react-i18next'

import { Button, CenterPopup } from 'antd-mobile'

import './NetErrorTips.less'



type Props = {

  visible: boolean

  message?: string

  onClose: () => void

  onSwitchNet: () => void

}




export default function NetErrorTips({ visible, message, onClose, onSwitchNet }: Props) {

  const { t } = useTranslation()



  const showMessage = message || t('home.current_network_is_unsupported')



  return (

    <CenterPopup

      visible={visible}

      onMaskClick={onClose}

      className="overlay-net-error"

      style={{ '--z-index': '3000' }}

      maskStyle={{ background: 'rgba(0,0,0,.4)' }}

    >

      <div className="net-error-tips">

        <div className="message">{showMessage}</div>

        <div className="btn">

          <Button

            className="btn-switch"

            color="primary"

            onClick={() => {

              onClose()

              onSwitchNet()

            }}

          >

            {t('common.switch_network')}

          </Button>

        </div>

      </div>

    </CenterPopup>

  )

}


