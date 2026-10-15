import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import qs from 'qs'
import { Toast } from 'antd-mobile'
import { resolveSessionId } from '@/stores/session'
import { forceLogout } from '@/lib/forceLogout'
import { forceHideLoading, setSuppressApiErrorToast } from '@/lib/tips'

type ExtraConfig = AxiosRequestConfig & {
  ignoreErrorPage?: boolean
  contentType?: string
  startTime?: number
  endTime?: number
  __retriedAfter499?: boolean
}

let refreshSessionHandler: ((param?: { url?: string }) => Promise<any>) | null = null

let invalidSessionFlow: Promise<void> | null = null

let recoverInvalidCartHandler: (() => Promise<any>) | null = null

let invalidCartFlow: Promise<void> | null = null
const handledInvalidCartIds = new Set<string>()

export function setRefreshSessionHandler(handler: (param?: { url?: string }) => Promise<any>) {
  refreshSessionHandler = handler
}

export function setRecoverInvalidCartHandler(handler: () => Promise<any>) {
  recoverInvalidCartHandler = handler
}

const API_BASE =
  import.meta.env.VITE_API_BASE

const INVALID_SESSION_TOAST_MS = 2000

function isInvalidSession(payload: any) {
  return Number(payload?.code) === -1 && payload?.msg === 'Invalid session'
}

function rejectInvalidSession(payload: any) {
  const msg = payload?.msg || payload?.message || 'Invalid session'
  const error = {
    code: payload?.code ?? -1,
    message: payload?.message || msg,
    msg,
    invalidSession: true,
  }

  forceHideLoading()
  setSuppressApiErrorToast(INVALID_SESSION_TOAST_MS + 1500)

  if (!invalidSessionFlow) {
    invalidSessionFlow = new Promise<void>((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        forceLogout({ redirectHome: true })
        invalidSessionFlow = null
        resolve()
      }
      Toast.show({
        content: msg,
        position: 'center',
        duration: INVALID_SESSION_TOAST_MS,
        afterClose: finish,
      })
      window.setTimeout(finish, INVALID_SESSION_TOAST_MS + 100)
    })
  }

  return invalidSessionFlow.then(() => Promise.reject(error))
}

const INVALID_CART_SUPPRESS_MS = 1500

function extractCartIdFromUrl(url?: string) {
  const matched = /(?:guest-carts|getZhe)\/([^/?#]+)/.exec(url || '')
  return matched ? decodeURIComponent(matched[1]) : ''
}

function isInvalidCartId(status: number, payload: any, url?: string) {
  return (
    Number(status) === 404 &&
    payload?.parameters?.fieldName === 'cartId' &&
    /no such entity/i.test(String(payload?.message || '')) &&
    !!extractCartIdFromUrl(url)
  )
}

function formatEntityMessage(payload: any) {
  const params = payload?.parameters || {}
  return String(payload?.message || '').replace(/%(\w+)/g, (raw, key) =>
    key in params ? String(params[key]) : raw,
  )
}

function rejectInvalidCart(payload: any, url?: string) {
  const msg = formatEntityMessage(payload) || 'Cart not found'
  const error = { code: 404, message: msg, msg, invalidCart: true }
  const staleCartId = extractCartIdFromUrl(url)

  if (!invalidCartFlow && !handledInvalidCartIds.has(staleCartId)) {
    handledInvalidCartIds.add(staleCartId)
    invalidCartFlow = Promise.resolve(recoverInvalidCartHandler?.())
      .then(
        () => undefined,
        () => undefined,
      )
      .finally(() => {
        invalidCartFlow = null
      })
  }

  return (invalidCartFlow || Promise.resolve()).then(() => {
    setSuppressApiErrorToast(INVALID_CART_SUPPRESS_MS)
    return Promise.reject(error)
  })
}

function createHttp(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE,
    timeout: 60000,
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'brackets' }),
  })

  instance.interceptors.request.use((config) => {
    const cfg = config as ExtraConfig
    cfg.startTime = Date.now()
    cfg.headers = cfg.headers || {}
    cfg.headers['Content-Type'] = cfg.contentType || 'application/json'
    const sessionIdCookie = resolveSessionId()
    if (sessionIdCookie) {
      cfg.headers['session-id'] = sessionIdCookie
    }
    return cfg as typeof config
  })

  instance.interceptors.response.use(
    (response) => {
      const cfg = response.config as ExtraConfig
      cfg.endTime = Date.now()
      if (response.status === 200) {
        if (isInvalidSession(response.data)) {
          return rejectInvalidSession(response.data)
        }
        return response.data ?? ' '
      }
      return Promise.reject({ code: response.status, ...response })
    },
    async (error) => {
      const response = error.response || {}
      const responseConfig = (response.config || error.config || {}) as ExtraConfig
      if (isInvalidSession(response.data)) {
        return rejectInvalidSession(response.data)
      }
      if (response.status === 499 && refreshSessionHandler && !responseConfig.__retriedAfter499) {
        await refreshSessionHandler({ url: responseConfig.url })
        const retryConfig: ExtraConfig = {
          ...responseConfig,
          __retriedAfter499: true,
          headers: {
            ...(responseConfig.headers || {}),
            'session-id': resolveSessionId(),
          },
        }
        return instance.request(retryConfig)
      }
      if (response.status === 499 && responseConfig.__retriedAfter499) {
        return Promise.reject({ refreshSessinId: true, code: 499, url: responseConfig.url })
      }
      if (isInvalidCartId(response.status, response.data, responseConfig.url)) {
        return rejectInvalidCart(response.data, responseConfig.url)
      }
      if (!responseConfig.ignoreErrorPage) {
        Toast.show({
          content: response.data?.msg || response.data?.message || error.message || `Error ${response.status || ''}`,
          position: 'center',
        })
      }
      return Promise.reject({
        code: response.status,
        message: response.data?.message || response.statusText,
        msg: response.data?.msg || response.data?.message || response.statusText,
      })
    },
  )

  return instance
}

export type HttpClient = {
  get<T = any>(url: string, config?: ExtraConfig): Promise<T>
  post<T = any>(url: string, data?: any, config?: ExtraConfig): Promise<T>
  put<T = any>(url: string, data?: any, config?: ExtraConfig): Promise<T>
  delete<T = any>(url: string, config?: ExtraConfig): Promise<T>
  request<T = any>(config: ExtraConfig): Promise<T>
}

export const http = createHttp() as HttpClient
