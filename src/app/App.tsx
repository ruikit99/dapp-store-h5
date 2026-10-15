import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd-mobile'
import enUS from 'antd-mobile/es/locales/en-US'
import zhCN from 'antd-mobile/es/locales/zh-CN'
import arSA from 'antd-mobile/es/locales/ar-SA'
import { I18nextProvider, useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { bootstrapApp } from '@/app/bootstrap'
import { setWalletNavigate, setWalletRouteName } from '@/lib/walletCtx'
import { setForceLogoutNavigate } from '@/lib/forceLogout'
import { initRuntimeChannel } from '@/lib/runtime'
import { getRouteNameFromPath } from '@/lib/routeNames'
import AppRoutes from '@/routes'

function resolveAntdLocale(lang: string) {
  if (lang === 'ar') return arSA
  if (lang === 'zh-cn' || lang?.startsWith('zh')) return zhCN
  return enUS
}

function Bootstrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const booted = useRef(false)

  useEffect(() => {
    setWalletNavigate((to) => navigate(to))
    setForceLogoutNavigate((to) => navigate(to))
  }, [navigate])

  useEffect(() => {
    setWalletRouteName(getRouteNameFromPath(location.pathname))
  }, [location.pathname])

  useEffect(() => {
    if (booted.current) return
    booted.current = true
    ;(async () => {
      await initRuntimeChannel()
      await bootstrapApp(getRouteNameFromPath(location.pathname))
    })()
  }, [location.pathname])

  return <>{children}</>
}

function AntdLocaleProvider({ children }: { children: React.ReactNode }) {
  const { i18n: i18next } = useTranslation()
  const [locale, setLocale] = useState(() => resolveAntdLocale(i18next.language))

  useEffect(() => {
    const onLang = (lng: string) => setLocale(resolveAntdLocale(lng))
    i18next.on('languageChanged', onLang)
    setLocale(resolveAntdLocale(i18next.language))
    return () => {
      i18next.off('languageChanged', onLang)
    }
  }, [i18next])

  return <ConfigProvider locale={locale}>{children}</ConfigProvider>
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AntdLocaleProvider>
        <BrowserRouter>
          <Bootstrapper>
            <AppRoutes />
          </Bootstrapper>
        </BrowserRouter>
      </AntdLocaleProvider>
    </I18nextProvider>
  )
}
