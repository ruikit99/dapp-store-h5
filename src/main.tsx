import '@/polyfills'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { setupI18n } from '@/i18n'
import { initBrowserStorage } from '@/lib/browserStorage'
import App from '@/app/App'
import '@/styles/global.less'
import '@/styles/arabic.less'
import 'antd-mobile/es/global'

async function main() {
  initBrowserStorage()
  await setupI18n()
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

main()
