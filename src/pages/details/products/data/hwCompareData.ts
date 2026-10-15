export type HwProduct = {
  sku: string
  slug: string
  boxClass: string
  image: string
  titleKey?: string
  titleFallback?: string
  pillLabel: string
  price: string
  theme: 'purple' | 'green' | 'neutral'
  pillActiveClass: string
}

export type HwFeatureValue =
  | string
  | { icon: string; textKey: string }
  | { icon: string; text: string }

export type HwFeature = {
  labelKey: string
  type: 'check' | 'platforms' | 'connection' | 'button' | 'text'
  values: HwFeatureValue[]
}

export const HW_PRODUCTS: HwProduct[] = [
  {
    sku: 'S1',
    slug: 's1',
    boxClass: 's1Box',
    image: '/images/product_landing/safepal_s1.png',
    titleKey: 's1.safepal_s1',
    pillLabel: 'S1',
    price: '$49.99',
    theme: 'purple',
    pillActiveClass: 'hwComparePill--purple',
  },
  {
    sku: 'X1',
    slug: 'x1',
    boxClass: 'x1Box',
    image: '/images/product_landing/safepal_x1.png',
    titleFallback: 'SafePal X1',
    pillLabel: 'X1',
    price: '$69.99',
    theme: 'green',
    pillActiveClass: 'hwComparePill--green',
  },
  {
    sku: 'S1P',
    slug: 's1pro',
    boxClass: 's1proBox',
    image: '/images/product_landing/safepal_s1pro.png',
    titleKey: 's1p.safepal_s1_pro',
    pillLabel: 'S1 Pro',
    price: '$89.99',
    theme: 'neutral',
    pillActiveClass: 'hwComparePill--neutral',
  },
]

export const HW_FEATURES: HwFeature[] = [
  { labelKey: 'store.cc_eal6_chip', type: 'check', values: ['check', 'check', 'check'] },
  { labelKey: 'store.pin_passphrase', type: 'check', values: ['check', 'check', 'check'] },
  { labelKey: 'store.self_destruct', type: 'check', values: ['check', 'check', 'check'] },
  { labelKey: 'store.device_authentication', type: 'check', values: ['check', 'check', 'check'] },
  { labelKey: 'store.anti_tampering_protection', type: 'check', values: ['check', 'check', 'check'] },
  { labelKey: 'store.os_compatibility', type: 'platforms', values: ['platforms', 'platforms', 'platforms'] },
  { labelKey: 'store.support200_blockchains', type: 'check', values: ['check', 'check', 'check'] },
  { labelKey: 'store.compatible_width_SafePal_app', type: 'check', values: ['check', 'check', 'check'] },
  { labelKey: 'store.compatible_with_SafePal_extension', type: 'check', values: ['check', 'check', 'check'] },
  {
    labelKey: 'store.connection',
    type: 'connection',
    values: [
      { icon: '/images/product_landing/QR.svg', textKey: 'store.qRcode' },
      { icon: '/images/product_landing/bluetooth.svg', textKey: 'store.than_bluetooth' },
      { icon: '/images/product_landing/QR.svg', textKey: 'store.qRcode' },
    ],
  },
  {
    labelKey: 'store.than_display',
    type: 'text',
    values: ['store.than_13full_screen', 'store.single_screen18', 'store.than_13full_screen'],
  },
  {
    labelKey: 'store.resolution',
    type: 'text',
    values: ['store.resolution_s1_s1p', 'store.resolution_x1', 'store.resolution_s1_s1p'],
  },
  {
    labelKey: 'store.materials',
    type: 'text',
    values: ['s1p.abs_pvc', 'store.abs_tempered_glass', 's1p.aluminum_alloy_tempered'],
  },
  {
    labelKey: 's1p.button',
    type: 'button',
    values: [
      { icon: '/images/product_landing/s1_button.svg', textKey: 's1p.d_pad' },
      { icon: '/images/product_landing/x1_button.svg', textKey: 'store.buttons12_Dpad' },
      { icon: '/images/product_landing/s1_button.svg', textKey: 's1p.d_pad' },
    ],
  },
  {
    labelKey: 'store.than_battery',
    type: 'text',
    values: ['store.than_400amh', 'store.than_200amh', 'store.than_500mah'],
  },
]

export function sortHwProducts(prioritySku?: string): HwProduct[] {
  if (!prioritySku) return [...HW_PRODUCTS]
  const priority = HW_PRODUCTS.find((p) => p.sku === prioritySku)
  const rest = HW_PRODUCTS.filter((p) => p.sku !== prioritySku)
  return priority ? [priority, ...rest] : [...HW_PRODUCTS]
}

export function hwSkuValueIndex(sku: string): number {
  return HW_PRODUCTS.findIndex((p) => p.sku === sku)
}
