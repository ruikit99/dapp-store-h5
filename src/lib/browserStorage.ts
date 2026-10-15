/** 带时效的浏览器存储：有 expires 写 localStorage，无 expires 写 sessionStorage（等同会话级），SESSION_BOUND_KEYS 除外 */

const KEY_PREFIX = 'sp:'
const DAY_MS = 86400000
/** 不能用 KEY_PREFIX 开头，否则会被 purgeExpired 当作无效记录删除 */
const LEGACY_MIGRATED_FLAG = 'sp__legacyCookieMigrated'

export interface StoredOptions {
  /** 过期时间：天数（可为小数）或具体时间点 */
  expires?: number | Date
}

interface StoredRecord {
  v: string
  /** 绝对过期时间戳（ms），null 表示会话级 */
  e: number | null
}

/** 未传 expires 时跟随 session_id 的过期时间（无有效 session 时按 1 天），保证登录态相关键在各标签页一致 */
const SESSION_BOUND_KEYS = ['connect', 'wallet-address']
const SESSION_BOUND_FALLBACK_DAYS = 1

/** 旧 cookie 迁移时的时效（天），undefined 走 setStored 默认规则；session_id 须排在 SESSION_BOUND_KEYS 之前 */
const LEGACY_COOKIE_EXPIRES: Record<string, number | undefined> = {
  currentLang: 365,
  session_id: 1,
  cartId: 1,
  connect: undefined,
  'wallet-address': undefined,
}

let initialized = false

function getStorage(kind: 'local' | 'session'): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

function storageKey(key: string) {
  return KEY_PREFIX + key
}

function resolveExpiresAt(expires?: number | Date): number | null {
  if (expires instanceof Date) return expires.getTime()
  if (typeof expires === 'number' && Number.isFinite(expires)) return Date.now() + expires * DAY_MS
  return null
}

function readRecord(storage: Storage, fullKey: string): StoredRecord | null {
  const raw = storage.getItem(fullKey)
  if (raw == null) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.v === 'string') {
      return { v: parsed.v, e: typeof parsed.e === 'number' ? parsed.e : null }
    }
  } catch {
    // 非本模块写入的数据，按无效处理
  }
  storage.removeItem(fullKey)
  return null
}

function isExpired(record: StoredRecord) {
  return record.e != null && Date.now() >= record.e
}

function purgeExpired() {
  for (const kind of ['local', 'session'] as const) {
    const storage = getStorage(kind)
    if (!storage) continue
    const keys: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i)
      if (k && k.startsWith(KEY_PREFIX)) keys.push(k)
    }
    keys.forEach((k) => {
      const record = readRecord(storage, k)
      if (record && isExpired(record)) storage.removeItem(k)
    })
  }
}

function legacyCookieAttributes() {
  const isHttps = typeof location !== 'undefined' && location.protocol === 'https:'
  return isHttps ? 'path=/; SameSite=Lax; Secure' : 'path=/; SameSite=Lax'
}

function readLegacyCookies(): Record<string, string> {
  if (typeof document === 'undefined' || !document.cookie) return {}
  const result: Record<string, string> = {}
  document.cookie.split('; ').forEach((part) => {
    const idx = part.indexOf('=')
    if (idx <= 0) return
    const name = part.slice(0, idx)
    try {
      result[decodeURIComponent(name)] = decodeURIComponent(part.slice(idx + 1))
    } catch {
      result[name] = part.slice(idx + 1)
    }
  })
  return result
}

function deleteLegacyCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${legacyCookieAttributes()}`
}

/** 旧 cookie 仅首次导入存储；之后每次启动只删除，避免已退出 / 已过期的值被重新导入 */
function migrateLegacyCookies() {
  const cookies = readLegacyCookies()
  const local = getStorage('local')
  const shouldImport = local?.getItem(LEGACY_MIGRATED_FLAG) !== '1'
  Object.keys(LEGACY_COOKIE_EXPIRES).forEach((name) => {
    if (!(name in cookies)) return
    if (shouldImport && getStored(name) === undefined && cookies[name]) {
      setStored(name, cookies[name], { expires: LEGACY_COOKIE_EXPIRES[name] })
    }
    deleteLegacyCookie(name)
  })
  local?.setItem(LEGACY_MIGRATED_FLAG, '1')
}

/** 启动时调用：迁移旧 cookie 并清理已过期的缓存，可重复调用 */
export function initBrowserStorage() {
  if (initialized) return
  initialized = true
  try {
    migrateLegacyCookies()
    purgeExpired()
  } catch {
    // 存储不可用时静默降级
  }
}

export function getStored(key: string): string | undefined {
  initBrowserStorage()
  const fullKey = storageKey(key)
  for (const kind of ['session', 'local'] as const) {
    const storage = getStorage(kind)
    if (!storage) continue
    const record = readRecord(storage, fullKey)
    if (!record) continue
    if (isExpired(record)) {
      storage.removeItem(fullKey)
      continue
    }
    return record.v
  }
  return undefined
}

function sessionBoundExpiresAt(): number {
  const local = getStorage('local')
  const record = local ? readRecord(local, storageKey('session_id')) : null
  if (record?.e != null && !isExpired(record)) return record.e
  return Date.now() + SESSION_BOUND_FALLBACK_DAYS * DAY_MS
}

/** value 为 null / undefined 时等同 removeStored，避免存成字符串 "undefined" */
export function setStored(key: string, value: unknown, options?: StoredOptions) {
  initBrowserStorage()
  if (value == null) {
    removeStored(key)
    return
  }
  let expiresAt = resolveExpiresAt(options?.expires)
  if (expiresAt == null && SESSION_BOUND_KEYS.includes(key)) {
    expiresAt = sessionBoundExpiresAt()
  }
  const fullKey = storageKey(key)
  const target = getStorage(expiresAt == null ? 'session' : 'local')
  const other = getStorage(expiresAt == null ? 'local' : 'session')
  other?.removeItem(fullKey)
  if (!target) return
  const record: StoredRecord = { v: String(value), e: expiresAt }
  try {
    target.setItem(fullKey, JSON.stringify(record))
  } catch {
    // 配额不足等写入失败时忽略
  }
}

export function removeStored(key: string) {
  const fullKey = storageKey(key)
  getStorage('local')?.removeItem(fullKey)
  getStorage('session')?.removeItem(fullKey)
}
