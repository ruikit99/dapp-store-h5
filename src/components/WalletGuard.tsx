import { useTranslation } from 'react-i18next'
import { Button, CenterPopup } from 'antd-mobile'
import { onConnect } from '@/lib/connectWallet.js'
import { useWalletStore } from '@/stores/wallet'
import { resolveSessionId, useUiStore } from '@/stores/session'
import { notifyWalletConnectError, shouldAutoRestoreWallet } from '@/hooks/useRestoreWalletLogin'
import './WalletGuard.less'
import { CloseOutline } from 'antd-mobile-icons'

export default function WalletGuard() {
  const { t } = useTranslation()
  const visible = useUiStore((s) => s.signInVisible)
  const setSignInVisible = useUiStore((s) => s.setSignInVisible)
  const dismissSignIn = useUiStore((s) => s.dismissSignIn)
  const completeSignInSuccess = useUiStore((s) => s.completeSignInSuccess)
  const setWallet = useWalletStore((s) => s.setWallet)
  const setIsConnect = useWalletStore((s) => s.setIsConnect)

  const signIn = async () => {
    setSignInVisible(false)
    try {
      const res = await onConnect()
      if (!res) {
        dismissSignIn()
        return
      }
      setWallet(res)
      setIsConnect(!!res.isConnected)
      if (res.currentAccount) {
        useWalletStore.getState().setWalletAddress(res.currentAccount)
      }
      completeSignInSuccess()
    } catch (error: any) {
      dismissSignIn()
      notifyWalletConnectError(error, t('home.have_initiated_same_request'))
    }
  }

  return (
    <CenterPopup visible={visible} onMaskClick={dismissSignIn} className="overlay-sign">
      <div className="sign-tips">
        <div className="sign-header flex-row">
        <CloseOutline className="close-btn" onClick={dismissSignIn} style={{ fontSize: 20, fontWeight: 700 }} />
        </div>
        <div className="message">
          <h3>{t('home.welcome_to_safepal_store')}</h3>
          <p className="sub-title">{t('home.sign_in_wallet')}</p>
        </div>
        <div className="btn">
          <Button className="btn-switch" color="primary" onClick={signIn}>{t('home.sign_in')}</Button>
        </div>
      </div>
    </CenterPopup>
  )
}

export function requireWallet(onSuccess?: () => void): boolean {
  const wallet = useWalletStore.getState().wallet
  if (wallet?.currentAccount) return true
  if (resolveSessionId() && shouldAutoRestoreWallet()) return false
  useUiStore.getState().setSignInVisible(true, onSuccess)
  return false
}
