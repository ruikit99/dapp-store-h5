import i18n from '@/i18n'
import { api } from '@/api'
import { getStored, setStored, removeStored } from '@/lib/browserStorage'
import { useWalletStore } from '@/stores/wallet'
import { useSessionStore, useUiStore } from '@/stores/session'
import { showLoading, hideLoading, showToast, localizeCancelledByUserTip } from '@/lib/tips'

type NavigateFn = (to: string) => void

let navigate: NavigateFn = (to) => {
  window.location.href = to
}

let routeName = ''

export function setWalletNavigate(fn: NavigateFn) {
  navigate = fn
}

export function setWalletRouteName(name: string) {
  routeName = name
}

/** 沿用旧 $cookiz 接口供 connectWallet.js 调用，实际读写浏览器存储 */
const cookiz = {
  get: (key: string) => getStored(key),
  set: (key: string, value: unknown, opts?: { path?: string; maxAge?: number }) => {
    const expires = opts?.maxAge ? opts.maxAge / 86400 : undefined
    setStored(key, value, { expires })
  },
  remove: (key: string) => removeStored(key),
}

const netErrTips = {
  showNetErrTips: (text: string) => showToast(text),
}

export function getWalletCtx() {
  const wallet = useWalletStore.getState()
  const session = useSessionStore.getState()
  return {
    $cookiz: cookiz,
    $Api: api,
    $i18n: { t: (key: string, options?: any) => String(i18n.t(key, options)) },
    $store: {
      state: {
        sessionId: session.sessionId,
        wallet: wallet.wallet,
        isConnect: wallet.isConnect,
        netAssign: wallet.netAssign,
        netValue: wallet.netValue,
      },
      commit: (type: string, payload?: any) => {
        switch (type) {
          case 'setSessionId':
            useSessionStore.getState().persistSessionId(payload)
            break
          case 'setWallet':
            useWalletStore.getState().setWallet(payload)
            break
          case 'setIsConnect':
            useWalletStore.getState().setIsConnect(payload)
            break
          case 'setWalletAddress':
            useWalletStore.getState().setWalletAddress(payload)
            break
          case 'setNetValue':
            useWalletStore.getState().setNetValue(payload)
            break
          default:
            break
        }
      },
    },
    $router: {
      get name() {
        return routeName
      },
      replace: (to: string) => navigate(to),
      push: (to: string) => navigate(to),
    },
    $myLoading: {
      showLoading: () => showLoading(),
      closeLoading: () => hideLoading(),
    },
    $tips: {
      showError: ({ text }: { show?: boolean; text: string; timing?: number }) =>
        showToast(localizeCancelledByUserTip(text)),
    },
    $netErrTips: netErrTips,
    $sigin: {
      closeSigin: () => useUiStore.getState().setSignInVisible(false),
    },
  }
}

export default getWalletCtx
