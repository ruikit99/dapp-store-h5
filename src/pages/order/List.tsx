import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Divider } from 'antd-mobile'
import { api } from '@/api'
import { useWalletStore } from '@/stores/wallet'
import { resolveSessionId, useUiStore } from '@/stores/session'
import { onConnect } from '@/lib/connectWallet.js'
import { showLoading, hideLoading, showToast } from '@/lib/tips'
import './List.less'

export default function OrderListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const wallet = useWalletStore((s) => s.wallet)
  const setWallet = useWalletStore((s) => s.setWallet)
  const setIsConnect = useWalletStore((s) => s.setIsConnect)
  const setSignInVisible = useUiStore((s) => s.setSignInVisible)
  const [list, setList] = useState<any[]>([])
  const [needAuth, setNeedAuth] = useState(false)

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

  useEffect(() => {
    const sid = resolveSessionId()
    if (!wallet?.currentAccount || !sid) {
      setNeedAuth(true)
      return
    }
    setNeedAuth(false)
    getList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.currentAccount])

  const getList = () => {
    if (!wallet?.currentAccount) return
    showLoading()
    api
      .orderList({ address: wallet.currentAccount, chain_id: wallet.chainId })
      .then((res: any) => {
        if (res?.refreshSessinId) {
          navigate('/')
        } else {
          setList(Array.isArray(res) ? res : [])
        }
      })
      .catch((error: any) => showToast(error?.msg || error?.message || 'Error'))
      .finally(() => hideLoading())
  }

  const signIn = async () => {
    if (!resolveSessionId()) {
      setSignInVisible(true)
      return
    }
    try {
      const res = await onConnect()
      if (!res) return
      setWallet(res)
      setIsConnect(!!res.isConnected)
    } catch (error: any) {
      if (error?.code !== 4001) showToast(error?.msg || error?.message || 'Error')
    }
  }

  if (needAuth) {
    return (
      <div className="order-container page-container">
        <h3 className="title">{t('order.my_order')}</h3>
        <div className="no-date">
          <div className="text">{t('home.sign_in_wallet')}</div>
          <div className="back-home">
            <Button className="btn-home" onClick={signIn}>
              {t('home.sign_in')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="order-container page-container">
      <h3 className="title">{t('order.my_order')}</h3>
      {list.length > 0 ? (
        <div className="order-content">
          {list.map((item, index) => (
            <div
              key={item.entity_id ?? item.increment_id ?? index}
              className="order-item"
              onClick={() => navigate(`/order/detail/${item.entity_id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/order/detail/${item.entity_id}`)}
            >
              <div className="no-status">
                <div className="order-no">
                  {t('order.order_no')} : {item.increment_id}
                </div>
                <div className="status">
                  {statusText[item.showOrderStatusDesc] || item.showOrderStatusDesc}
                </div>
              </div>
              <Divider style={{ borderColor: '#E1E0EC', margin: 0 }} />
              <div className="list-img">
                {(item.items || []).map((k: any, itemIndex: number) => (
                  <div key={k.item_id ?? itemIndex} className="img-items">
                    <img src={`https://static.isafepal.com/mshop/dev/${k.image}`} alt="" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-date">
          <div className="text">{t('common.no_data')}</div>
          <div className="back-home">
            <Button className="btn-home" onClick={() => navigate('/')}>
              {t('common.back_to_home')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
