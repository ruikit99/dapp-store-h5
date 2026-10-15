import { Popup } from 'antd-mobile'
import { CheckCircleFill, CloseOutline } from 'antd-mobile-icons'
import { useTranslation } from 'react-i18next'
import { netWorkList, switchChain } from '@/lib/connectWallet.js'
import { useWalletStore } from '@/stores/wallet'
import { hideLoading, showLoading, showToast } from '@/lib/tips'
import './SwitchNet.less'

type NetItem = {
  title: string
  label: string
  value: string | number
  icon: string
}

type Props = {
  visible: boolean
  onClose: () => void
}

export default function SwitchNet({ visible, onClose }: Props) {
  const { t } = useTranslation()
  const netValue = useWalletStore((s) => s.netValue)
  const list = netWorkList as NetItem[]

  const clickItem = async (item: NetItem) => {
    if (`${netValue?.value}` === `${item.value}`) return
    showLoading()
    try {
      await switchChain((window as any).ethereum, item.value)
      onClose()
    } catch (error: any) {
      if (error?.code === 4902) {
        showToast(t('common.wallet_dont_network_switch'))
      } else if (error?.code === -32002) {
        showToast(t('home.have_initiated_same_request'))
      } else if (error?.code === 4001) {
        return
      } else {
        showToast(error?.message || 'switch network failed')
      }
    } finally {
      hideLoading()
    }
  }

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      onClose={onClose}
      position="bottom"
      className="select-network-popup"
      bodyClassName="select-network-popup"
      bodyStyle={{ height: '70%', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
    >
      <div className="select-content">
        <div className="top-title">
          <span className="left" />
          <span className="title">{t('home.select_network')}</span>
          <span onClick={onClose} role="button" tabIndex={0}>
            <CloseOutline fontSize={20} />
          </span>
        </div>
        <div className="select-box" style={{ overflowY: 'scroll' }}>
          {list.map((p, index) => {
            const selected = `${netValue?.value}` === `${p.value}`
            return (
              <div
                key={`${p.value}_${index}`}
                className="select-item item-net cursor-pointer"
                onClick={() => clickItem(p)}
              >
                <div className="item-content">
                  <img className="images" src={p.icon} alt="" />
                  <p className={`title${selected ? ' selected' : ''}`}>{p.title}</p>
                </div>
                <div className="item-ckecked-icon">
                  <CheckCircleFill fontSize={18} color={selected ? '#4a21ef' : '#CAC9D8'} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Popup>
  )
}
