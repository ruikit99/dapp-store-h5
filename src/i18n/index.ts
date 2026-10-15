import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getStored, setStored } from '@/lib/browserStorage'

export const localeMap: Record<string, { code: string; file: string; name: string; label: string }> = {
  en: { code: 'en', file: 'en', name: 'English', label: 'EN' },
  de: { code: 'de', file: 'de', name: 'Deutsch', label: 'DE' },
  fr: { code: 'fr', file: 'fr', name: 'Français', label: 'FR' },
  es: { code: 'es', file: 'es', name: 'Español', label: 'ES' },
  tr: { code: 'tr', file: 'tr', name: 'Türkçe', label: 'TR' },
  it: { code: 'it', file: 'it', name: 'Italiano', label: 'IT' },
  pt: { code: 'pt', file: 'pt', name: 'Português', label: 'PT-BR' },
  'zh-cn': { code: 'zh-cn', file: 'zh-cn', name: '简体中文', label: 'ZH' },
  'zh-tc': { code: 'zh-tc', file: 'zh-tc', name: '繁體中文', label: 'ZH-TW' },
  jp: { code: 'jp', file: 'jp', name: '日本語', label: 'JA' },
  ru: { code: 'ru', file: 'ru', name: 'Русский', label: 'RU' },
  th: { code: 'th', file: 'th', name: 'ภาษาไทย', label: 'TH' },
  id: { code: 'id', file: 'id', name: 'Bahasa Indonesia', label: 'ID' },
  vn: { code: 'vn', file: 'vn', name: 'Tiếng Việt', label: 'VI' },
  ar: { code: 'ar', file: 'ar', name: 'عربي', label: 'AR' },
  kr: { code: 'kr', file: 'ko', name: '한국어', label: 'KO' },
}

const loaders: Record<string, () => Promise<{ default: any }>> = {
  en: () => import('../../locales/en.js'),
  'zh-cn': () => import('../../locales/zh-cn.js'),
  'zh-tc': () => import('../../locales/zh-tc.js'),
  ko: () => import('../../locales/ko.js'),
  jp: () => import('../../locales/jp.js'),
  ar: () => import('../../locales/ar.js'),
  fr: () => import('../../locales/fr.js'),
  de: () => import('../../locales/de.js'),
  it: () => import('../../locales/it.js'),
  es: () => import('../../locales/es.js'),
  tr: () => import('../../locales/tr.js'),
  pt: () => import('../../locales/pt.js'),
  ru: () => import('../../locales/ru.js'),
  th: () => import('../../locales/th.js'),
  id: () => import('../../locales/id.js'),
  vn: () => import('../../locales/vn.js'),
}

export function resolveLocaleCode(code?: string | null): string {
  const normalized = (code || 'en').toLowerCase()
  return localeMap[normalized] ? normalized : 'en'
}

export function isRtlLang(code?: string | null) {
  return resolveLocaleCode(code) === 'ar'
}

export function applyDocumentLang(code: string) {
  const resolved = resolveLocaleCode(code)
  document.documentElement.lang = resolved
  document.documentElement.dir = isRtlLang(resolved) ? 'rtl' : 'ltr'
}

async function loadLocale(code: string) {
  const meta = localeMap[code] || localeMap.en
  const loader = loaders[meta.file] || loaders.en
  const mod = await loader()
  return mod.default
}

async function ensureResourceBundles(code: string) {
  if (!i18n.hasResourceBundle(code, 'translation')) {
    const resources = await loadLocale(code)
    i18n.addResourceBundle(code, 'translation', resources, true, true)
  }
  if (code !== 'en' && !i18n.hasResourceBundle('en', 'translation')) {
    const enResources = await loadLocale('en')
    i18n.addResourceBundle('en', 'translation', enResources, true, true)
  }
}

export async function changeAppLanguage(code: string) {
  const resolved = resolveLocaleCode(code)
  await ensureResourceBundles(resolved)
  await i18n.changeLanguage(resolved)
  setStored('currentLang', resolved, { expires: 365 })
  applyDocumentLang(resolved)
}

export async function setupI18n() {
  const saved = resolveLocaleCode(getStored('currentLang'))
  const resources = await loadLocale(saved)
  const initResources: Record<string, { translation: any }> = {
    [saved]: { translation: resources },
  }
  if (saved !== 'en') {
    initResources.en = { translation: await loadLocale('en') }
  }
  await i18n.use(initReactI18next).init({
    resources: initResources,
    lng: saved,
    fallbackLng: 'en',
    lowerCaseLng: true,
    interpolation: { escapeValue: false },
  })
  applyDocumentLang(saved)
  return i18n
}

export default i18n
