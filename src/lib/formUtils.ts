export function formatter(value: string) {
  const pattern = new RegExp(
    "[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）《》——|{}【】‘；：”“'。，、？↵\r\n]",
  )
  return String(value ?? '').replace(pattern, '')
}

export const EMAIL_PATTERN =
  /[a-zA-Z0-9]+([-_.][A-Za-z\d]+)*@([a-zA-Z0-9]+[-.])+[A-Za-z\d]{2,20}$/

export function isChineseName(value: string) {
  return /^[\u4e00-\u9fa5]{1,20}$/.test(value)
}

export function hasChineseChars(value: string, maxLen = 70) {
  return new RegExp(`^(?=.*?[\\u4E00-\\u9FA5])[\\s\\S]{1,${maxLen}}$`).test(value)
}

export function hasMinChineseChars(value: string, min = 5, maxLen = 70) {
  return new RegExp(`^(?=(?:.*?[\\u4E00-\\u9FA5]){${min}})[\\s\\S]{1,${maxLen}}$`).test(value)
}

export function isValidPostalCode(value: string) {
  return /^(?!-)(?!.*-$)[0-9a-zA-Z-]{0,9}$/.test(value || '')
}

export function isValidCnPhone(value: string) {
  return /(^(0[0-9]{2,3}\-)?([2-9][0-9]{6,7})+(\-[0-9]{1,4})?$)|(^((\(\d{3}\))|(\d{3}\-))?(1[35789]\d{9})$)|(^86((\(\d{3}\))|(\d{3}\-))?(1[35789]\d{9})$)|(^\+86((\(\d{3}\))|(\d{3}\-))?(1[35789]\d{9})$)/.test(
    value,
  )
}

export function isValidIntlPhone(value: string) {
  return /^[0-9 +-]+$/.test(value)
}

export function isValidTwPid(value: string) {
  return /^[a-zA-Z][a-zA-Z0-9]{9,10}$/.test(value)
}

export function isValidZaPid(value: string) {
  return /^\d{13}$/.test(value)
}

export function isValidTrPid(value: string) {
  return /^\d{11}(?!\d)/.test(value)
}

export function isValidBrTax(value: string) {
  return (
    /^(\d{3})(\.\d{3}){2}(-)(\d{2})$/.test(value) ||
    /^(\d{2})(\.\d{3}){2}(\/)(\d{4})(-)(\d{2})$/.test(value)
  )
}

export function isValidClTax(value: string) {
  return /^(\d{2})(\.\d{3}){2}(-)(\d{1})$/.test(value)
}

export const EORI_VAT_COUNTRIES = [
  'AT',
  'BE',
  'CZ',
  'DK',
  'FI',
  'FR',
  'DE',
  'IE',
  'IT',
  'NL',
  'NO',
  'PL',
  'PT',
  'ES',
  'SE',
  'CH',
  'GB',
  'BG',
  'CY',
  'EE',
  'GR',
  'HU',
  'LV',
  'LT',
  'LU',
  'RO',
  'SI',
  'SK',
  'MT',
  'HR',
]

export function isEoriVatCountry(countryId?: string) {
  return Boolean(countryId && EORI_VAT_COUNTRIES.includes(countryId))
}

export function isPostalCodeOptional(countryId?: string, provinceId?: string) {
  return (
    provinceId === '689' ||
    provinceId === '696' ||
    countryId === 'HK' ||
    countryId === 'MO'
  )
}

export function needsChineseHint(countryId?: string, provinceId?: string) {
  return countryId === 'TW' || countryId === 'CN' || provinceId === '705'
}

export function isTwRegion(countryId?: string, provinceId?: string) {
  return countryId === 'TW' || provinceId === '705'
}

export function needsChineseValidation(countryId?: string, provinceId?: string) {
  return countryId === 'CN' || countryId === 'TW' || provinceId === '705'
}

export function needsChineseNameValidation(countryId?: string, provinceId?: string) {
  return isTwRegion(countryId, provinceId)
}

export function scrollToFirstFormError(
  errorInfo?: { errorFields?: { name: (string | number)[] }[] },
) {
  const namePath = errorInfo?.errorFields?.[0]?.name
  if (!namePath?.length) return

  const scroll = () => {
    const fieldId = namePath.map(String).join('_')
    const inputEl = document.getElementById(fieldId)
    const target =
      inputEl?.closest('.form-items') ??
      inputEl?.closest('.adm-form-item') ??
      inputEl ??
      document.querySelector('.adm-form-item-feedback-error')?.closest('.form-items') ??
      document.querySelector('.adm-form-item-feedback-error')?.closest('.adm-form-item')

    target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  }

  requestAnimationFrame(scroll)
}

export const PO_BOX_HINT_EXCLUDED_COUNTRIES = ['AU', 'CA', 'GH', 'GR', 'KE', 'NO', 'TZ'] as const

export function shouldShowPoBoxHint(countryId?: string) {
  return !countryId || !(PO_BOX_HINT_EXCLUDED_COUNTRIES as readonly string[]).includes(countryId)
}
