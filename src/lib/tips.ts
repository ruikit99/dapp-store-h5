import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Toast, Dialog, Mask, SpinLoading } from 'antd-mobile'
import i18n from '@/i18n'

let suppressApiErrorToast = false
let suppressApiErrorToastTimer: number | null = null

export function setSuppressApiErrorToast(durationMs = 3000) {
  suppressApiErrorToast = true
  if (suppressApiErrorToastTimer != null) window.clearTimeout(suppressApiErrorToastTimer)
  suppressApiErrorToastTimer = window.setTimeout(() => {
    suppressApiErrorToast = false
    suppressApiErrorToastTimer = null
  }, durationMs)
}

export function localizeCancelledByUserTip(text: string): string {
  if (typeof text === 'string' && text.trim().toLowerCase() === 'cancelled by user') {
    return String(i18n.t('common.cancelled_by_user'))
  }
  return text
}

export function showToast(message: string) {
  if (suppressApiErrorToast) return
  Toast.show({ content: message, position: 'center' })
}

let loadingCount = 0
let loadingRoot: Root | null = null
let loadingContainer: HTMLDivElement | null = null
let loadingContent = 'Loading...'

function renderLoading() {
  if (!loadingContainer) {
    loadingContainer = document.createElement('div')
    document.body.appendChild(loadingContainer)
    loadingRoot = createRoot(loadingContainer)
  }
  loadingRoot!.render(
    createElement(
      Mask,
      { visible: true, opacity: 'thin', color: 'black', disableBodyScroll: true, style: { '--z-index': '9999' } },
      createElement(
        'div',
        {
          style: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: '20px 24px',
            borderRadius: 8,
            background: 'rgba(0, 0, 0, 0.7)',
            direction: 'ltr',
            unicodeBidi: 'isolate',
          },
        },
        createElement(SpinLoading, { color: 'white', style: { '--size': '32px' } }),
        createElement('div', { style: { color: '#fff', fontSize: 14, textAlign: 'center' } }, loadingContent),
      ),
    ),
  )
}

function unmountLoading() {
  loadingRoot?.unmount()
  loadingRoot = null
  loadingContainer?.remove()
  loadingContainer = null
}

export function showLoading(content = 'Loading...') {
  loadingCount += 1
  loadingContent = content
  renderLoading()
}

export function hideLoading() {
  if (loadingCount <= 0) return
  loadingCount -= 1
  if (loadingCount === 0) unmountLoading()
}

export function forceHideLoading() {
  loadingCount = 0
  unmountLoading()
}

export async function showConfirm(content: string, title = '') {
  return Dialog.confirm({ content, title })
}

export function ConnectWalletToast() {
  showLoading('connecting...')
  return {
    clear: () => hideLoading(),
  }
}
