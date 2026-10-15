import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Divider, Mask, Popover } from 'antd-mobile'
import { changeAppLanguage, localeMap } from '@/i18n'
import { onConnect } from '@/lib/connectWallet.js'
import { useWalletStore } from '@/stores/wallet'
import { useUiStore, resolveSessionId } from '@/stores/session'
import { forceLogout } from '@/lib/forceLogout'
import { notifyWalletConnectError } from '@/hooks/useRestoreWalletLogin'
import './Header.less'

const logoDark = ''
const logoLight = ''
const iconAvatar = ''
const iconAvatarWhite = ''
const iconUser = ''
const iconHome = ''
const iconCreateOrder = ''
const iconLogOut = ''

export default function Header() {
  const { t, i18n } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  const wallet = useWalletStore((s) => s.wallet)
  const netValue = useWalletStore((s) => s.netValue)
  const setWallet = useWalletStore((s) => s.setWallet)
  const setIsConnect = useWalletStore((s) => s.setIsConnect)
  const setSignInVisible = useUiStore((s) => s.setSignInVisible)

  const currentAccount = wallet?.currentAccount as string | undefined

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 5)
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const connectWallet = async () => {
    const sessionId = resolveSessionId()
    if (!sessionId) {
      setSignInVisible(true)
      return
    }
    try {
      const res = await onConnect()
      if (!res) return
      setWallet(res)
      setIsConnect(!!res.isConnected)
      if (res.currentAccount) {
        useWalletStore.getState().setWalletAddress(res.currentAccount)
      }
    } catch (error: any) {
      notifyWalletConnectError(error, t('home.have_initiated_same_request'))
    }
  }

  const logOut = () => {
    forceLogout({ redirectHome: true })
    setMenuOpen(false)
  }

  const switchLang = async (code: string) => {
    await changeAppLanguage(code)
    setLangOpen(false)
  }

  return (
    <header ref={headerRef} className={`header-container${scrolled ? ' header-scrolled' : ''}`}>
      <div className="header-container-box flex-row">
        <Link to="/" className={`logo`}>
          <img className="logo-dark" src={logoDark} alt="SafePal" height={24} />
          <img className="logo-light" src={logoLight} alt="SafePal" height={24} />
        </Link>
        <div className="other flex-row">
          <button type="button" className="icon-language" onClick={() => setLangOpen(true)} aria-label="Language">
            <svg className="icon-dark" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#4a21ef" strokeWidth="1.25" />
              <path d="M2 12H22" stroke="#4a21ef" strokeWidth="1.25" />
              <path d="M12 2C14.5 4.7 16 8.3 16 12C16 15.7 14.5 19.3 12 22C9.5 19.3 8 15.7 8 12C8 8.3 9.5 4.7 12 2Z" stroke="#4a21ef" strokeWidth="1.25" />
            </svg>
            <svg className="icon-light" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#F7F6FF" strokeWidth="1.25" />
              <path d="M2 12H22" stroke="#F7F6FF" strokeWidth="1.25" />
              <path d="M12 2C14.5 4.7 16 8.3 16 12C16 15.7 14.5 19.3 12 22C9.5 19.3 8 15.7 8 12C8 8.3 9.5 4.7 12 2Z" stroke="#F7F6FF" strokeWidth="1.25" />
            </svg>
          </button>
          {currentAccount ? (
            <Popover
              visible={menuOpen}
              onVisibleChange={setMenuOpen}
              placement="bottom-end"
              trigger="click"
              mode="light"
              className="header-menu-popover"
              getContainer={() => headerRef.current ?? document.body}
              content={
                <div className="header-dropdown-menu">
                  <div className="dropdown-item item-info">
                    <div className="info-avatar">
                      <img src={iconUser} alt="" />
                    </div>
                    <div className="info-text">
                      <div className="address">
                        {`${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}`}
                      </div>
                      <div className="network">{netValue?.title}</div>
                    </div>
                  </div>
                  <div className="dropdown-item">
                    <Link to="/" className="item-link item-home" onClick={() => setMenuOpen(false)}>
                      <div className="icon">
                        <img src={iconHome} alt="" />
                      </div>
                      <div className="text">{t('home.home')}</div>
                    </Link>
                  </div>
                  <Divider style={{ borderColor: '#E1E0EC', margin: 0 }} />
                  <div className="dropdown-item">
                    <Link to="/order" className="item-link item-order" onClick={() => setMenuOpen(false)}>
                      <div className="icon">
                        <img src={iconCreateOrder} alt="" />
                      </div>
                      <div className="text">{t('order.my_order')}</div>
                    </Link>
                  </div>
                  <Divider style={{ borderColor: '#E1E0EC', margin: 0 }} />
                  <div className="dropdown-item">
                    <div className="item-link item-log-out" onClick={logOut} role="button" tabIndex={0}>
                      <div className="icon">
                        <img src={iconLogOut} alt="" />
                      </div>
                      <div className="text">{t('home.logout')}</div>
                    </div>
                  </div>
                </div>
              }
            >
              <button type="button" className="avatar" aria-label="Account">
                <img className="avatar-dark" src={iconAvatar} alt="" />
                <img className="avatar-white" src={iconAvatarWhite} alt="" />
              </button>
            </Popover>
          ) : (
            <Button size="small" className="btn-connect" onClick={connectWallet}>
              {t('common.connect_wallet')}
            </Button>
          )}
        </div>
      </div>

      <Mask visible={langOpen} onMaskClick={() => setLangOpen(false)}>
        <div className="language-popover" onClick={(e) => e.stopPropagation()}>
          {Object.values(localeMap).map((locale) => (
            <button
              key={locale.code}
              type="button"
              data-name={locale.label}
              className={`item${i18n.language === locale.code ? ' actived' : ''}`}
              onClick={() => switchLang(locale.code)}
            >
              {locale.name}
            </button>
          ))}
        </div>
      </Mask>
    </header>
  )
}
