const isClient = typeof window !== 'undefined'

export function isIos() {
  return isClient ? /(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent) : undefined
}

export function isAndroid() {
  return isClient ? /(Android|Linux)/i.test(navigator.userAgent) : undefined
}

export function isXL() {
  return isClient ? /XLMessenger/i.test(navigator.userAgent) : undefined
}

export function isMobile() {
  return isClient
    ? 'navigator' in window &&
        window.navigator.userAgent.match(
          /(iPad)|(iPhone)|(iPod)|(Android)|(PlayBook)|(BB10)|(BlackBerry)|(Opera Mini)|(IEMobile)|(webOS)|(MeeGo)/i,
        )
    : undefined
}

export const osCode = isIos() ? 2 : 1

export default {
  isIos,
  isAndroid,
  isXL,
  isMobile,
  osCode,
}
