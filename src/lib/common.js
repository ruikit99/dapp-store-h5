import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import i18n from '@/i18n'
import { showLoading, hideLoading } from '@/lib/tips'
dayjs.extend(utc)

export const Throttle = (func, delay) => {
  let timeOut = null
  return (...args) => {
    if (!timeOut) {
      timeOut = setTimeout(() => {
        timeOut = null
        func(...args)
      }, delay)
    }
  }
}

export function cloneObj(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export const ConnectWalletToast = () => {
  showLoading(i18n.t('home.connecting_wallet') || 'Connecting SafePal Wallet')
  return { clear: () => hideLoading() }
}

export const confirmTransaction = (message) => {
  showLoading(message)
  return { clear: () => hideLoading() }
}

export function isIos() {
  return /(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)
}

export function isAndroid() {
  return /(Android|Linux)/i.test(navigator.userAgent)
}

export function firstTextToImg(text = '', size = 60, color) {
  const trustedColor = ['#7E9AFF', '#2BBDB5', '#FFD37E', '#FF5AB5', '#2EBD85']
  const bg =
    color || trustedColor[Math.floor(Math.random() * trustedColor.length)]
  let initials = String(text).trim().toUpperCase()
  initials = initials.replace(/\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g, '')
  initials = initials ? initials.charAt(0) : '?'
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  context.fillStyle = bg
  context.fillRect(0, 0, size, size)
  context.fillStyle = '#FFF'
  context.font = Math.round(size / 2) + 'px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(initials, size / 2, size / 2)
  return canvas.toDataURL()
}

export function formatUtc(time, fmt = 'YYYY-MM-DD HH:mm:ss') {
  return dayjs.utc(time).format(fmt)
}
