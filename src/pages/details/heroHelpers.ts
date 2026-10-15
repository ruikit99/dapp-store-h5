import { formatPlistLabel, formatMoney, shortProductName } from '../home/bundleHelpers'

export type HeroProductKey = 's1' | 's1pro' | 'x1' | 'cypher' | 'leathercase' | 'other'

export type HeroChipItem = {
  type: 'single' | 'double' | 'bundle'
  cartSku: string
  label: string
  image: string
  price: string
  zhe_price: string
  hasDiscount: boolean
  discount?: string
}

export type HeroVideoInfo = {
  id: string
  thumbUrl: string
}

export type HeroGallerySlide =
  | { type: 'image'; url: string }
  | { type: 'video'; videoId: string; thumbUrl: string }

const CDN_BASE = 'https://static.isafepal.com/mshop/dev'

const HERO_VIDEO_URL_BY_KEY: Partial<Record<HeroProductKey, string>> = {
  s1: 'https://www.youtube.com/watch?v=iCe1bRxpFPI',
  s1pro: 'https://www.youtube.com/watch?v=Jq_gJ5dzyKg',
  x1: 'https://www.youtube.com/watch?v=brnFjLOTJ00',
  cypher: 'https://www.youtube.com/embed/aQt1otMEF8A',
}

export type HeroDisplayConfig = {
  productKey: HeroProductKey
  titleKey?: string
  title?: string
  subtitleKey?: string
  showEal6: boolean
  featureTags: string[]
  singleLabel: string
  hasDouble: boolean
  doubleCartSku?: string
  doubleImage?: string
  doublePriceKeys?: [string, string, string, string]
  chipSortOrder: string[]
}

const SKU_LABEL_MAP: Record<string, string> = {
  S1P: 'S1 Pro',
  S1: 'S1',
  X1: 'X1',
  CY: 'Cypher',
  LC: 'Leather Case',
  Cypher: 'Cypher',
  Leather: 'Leather Case',
}

const CHIP_SORT_ORDER: Record<string, string[]> = {
  s1pro: ['S1P', 'S1P_CY_LC', 'S1P_S1P', 'S1P_CY', 'S1P_LC'],
  s1: ['S1', 'Expert_choice', 'S1_S1', 'S1_Cypher', 'S1_Leather_Case'],
  x1: ['X1', 'X1_LC_CY', 'X1_X1', 'X1_CY', 'X1_LC'],
  cypher: ['CY', 'S1_Cypher', 'S1P_CY', 'X1_CY'],
  leathercase: ['LC', 'S1_Leather_Case', 'S1P_LC', 'X1_LC'],
}

export const CYPHER_BUNDLE_LIST = [
  {
    sku: 'S1_Cypher',
    price: 94.98,
    title1: 'Hardcore Bundle',
    title2: ' S1 + Cypher',
    zhe: '',
    zhe_point: 0,
    zhe_price: '99.72',
    d_price_S1: 99.98,
    d_zhe_S1: '5%',
    d_zhe_point_S1: 0.05,
    d_zhe_price_S1: '94.98',
  },
  {
    sku: 'S1P_CY',
    price: 134.98,
    title1: 'Hardcore Bundle',
    title2: ' S1 + Cypher',
    zhe: '',
    zhe_point: 0,
    zhe_price: '137.72',
    d_price_S1P: 179.98,
    d_zhe_S1P: '5%',
    d_zhe_point_S1P: 0.05,
    d_zhe_price_S1P: '170.98',
  },
  {
    sku: 'X1_CY',
    price: 114.98,
    title1: 'Hardcore Bundle',
    title2: ' S1 + Cypher',
    zhe: '',
    zhe_point: 0,
    zhe_price: '118.72',
    d_price_X1: 139.98,
    d_zhe_X1: '5%',
    d_zhe_point_X1: 0.05,
    d_zhe_price_X1: '132.98',
  },
] as const

export const LEATHERCASE_BUNDLE_LIST = [
  {
    sku: 'S1_Leather_Case',
    price: 59.98,
    title1: 'Standard Package',
    title2: ' S1 + Leather Case',
    zhe: '',
    zhe_point: 0,
    zhe_price: '99.72',
    d_price_S1: 99.98,
    d_zhe_S1: '5%',
    d_zhe_point_S1: 0.05,
    d_zhe_price_S1: '94.98',
  },
  {
    sku: 'S1P_LC',
    price: 99.98,
    title1: 'Standard Package',
    title2: ' S1 + Leather Case',
    zhe: '',
    zhe_point: 0,
    zhe_price: '137.72',
    d_price_S1P: 179.98,
    d_zhe_S1P: '5%',
    d_zhe_point_S1P: 0.05,
    d_zhe_price_S1P: '170.98',
  },
  {
    sku: 'X1_LC',
    price: 79.98,
    title1: 'Standard Package',
    title2: ' S1 + Leather Case',
    zhe: '',
    zhe_point: 0,
    zhe_price: '118.72',
    d_price_X1: 139.98,
    d_zhe_X1: '5%',
    d_zhe_point_X1: 0.05,
    d_zhe_price_X1: '132.98',
  },
] as const

export function getStaticHeroBundles(sku: string): any[] {
  const key = resolveHeroSku(sku)
  if (key === 'CY') return CYPHER_BUNDLE_LIST.map((item) => ({ ...item }))
  if (key === 'LC') return LEATHERCASE_BUNDLE_LIST.map((item) => ({ ...item }))
  return []
}

const HERO_CONFIG_BY_SKU: Record<string, HeroDisplayConfig> = {
  S1: {
    productKey: 's1',
    titleKey: 's1.safepal_s1',
    subtitleKey: 's1.hardware_wallet',
    showEal6: true,
    featureTags: [
      'EAL6+',
      '100% air-gapped signing',
      'Open source',
      'Self-destruct mechanism',
      'Passphrase',
      '200+ blockchains',
    ],
    singleLabel: 'S1',
    hasDouble: true,
    doubleCartSku: 'S1_S1',
    doubleImage: '/images/s1-double.png',
    doublePriceKeys: ['d_zhe_point_S1', 'd_zhe_price_S1', 'd_price_S1', 'd_zhe_S1'],
    chipSortOrder: CHIP_SORT_ORDER.s1,
  },
  S1P: {
    productKey: 's1pro',
    titleKey: 's1p.safepal_s1_pro',
    subtitleKey: 's1.hardware_wallet',
    showEal6: true,
    featureTags: [
      'EAL6+',
      '100% air-gapped signing',
      'Open source',
      'Self-destruct mechanism',
      'Passphrase',
      '200+ blockchains',
    ],
    singleLabel: 'S1 Pro',
    hasDouble: true,
    doubleCartSku: 'S1P_S1P',
    doubleImage: '/images/s1pro-double.png',
    doublePriceKeys: ['d_zhe_point_S1P', 'd_zhe_price_S1P', 'd_price_S1P', 'd_zhe_S1P'],
    chipSortOrder: CHIP_SORT_ORDER.s1pro,
  },
  X1: {
    productKey: 'x1',
    title: 'SafePal X1',
    subtitleKey: 's1.hardware_wallet',
    showEal6: true,
    featureTags: [
      'EAL6+',
      '100% air-gapped signing',
      'Open source',
      'Self-destruct mechanism',
      'Passphrase',
      '200+ blockchains',
    ],
    singleLabel: 'X1',
    hasDouble: true,
    doubleCartSku: 'X1_X1',
    doubleImage: '/images/x1-double.png',
    doublePriceKeys: ['d_zhe_point_X1', 'd_zhe_price_X1', 'd_price_X1', 'd_zhe_X1'],
    chipSortOrder: CHIP_SORT_ORDER.x1,
  },
  CY: {
    productKey: 'cypher',
    titleKey: 'cy.safepal_cypher',
    subtitleKey: 'cy.seed_board',
    showEal6: false,
    featureTags: [],
    singleLabel: 'Cypher',
    hasDouble: false,
    chipSortOrder: CHIP_SORT_ORDER.cypher,
  },
  LC: {
    productKey: 'leathercase',
    titleKey: 'lc.safepal_leather_case',
    showEal6: false,
    featureTags: [],
    singleLabel: 'Leather Case',
    hasDouble: false,
    chipSortOrder: CHIP_SORT_ORDER.leathercase,
  },
}

function formatPrice(value: unknown): string {
  return formatMoney(Number(value) || 0)
}

function normalizeDiscountLabel(raw: unknown): string {
  if (raw == null || raw === '') return ''
  return String(raw).trim().replace(/^-/, '')
}

function getBundleMainImg(img: string): string {
  if (!img) return img
  return img.replace(/(\.[a-zA-Z0-9]+)(\?.*)?$/, '_2$1$2')
}

function cdnSkuImage(sku: string): string {
  return `${CDN_BASE}/${sku}V2_2.png`
}

export function parseYouTubeId(url: string): string {
  if (!url) return ''
  const match = String(url).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  )
  return match ? match[1] : ''
}

export function getYouTubeThumbUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export function getHeroVideo(productKey: HeroProductKey): HeroVideoInfo | null {
  const url = HERO_VIDEO_URL_BY_KEY[productKey]
  if (!url) return null
  const id = parseYouTubeId(url)
  if (!id) return null
  return { id, thumbUrl: getYouTubeThumbUrl(id) }
}

export function getItemGalleryImages(
  item: HeroChipItem | null | undefined,
  productGallery: string[],
): string[] {
  if (!item || item.type === 'single') {
    return productGallery.slice()
  }
  return item.image ? [item.image] : []
}

export function getHeroGallerySlides(
  item: HeroChipItem | null | undefined,
  productGallery: string[],
  video: HeroVideoInfo | null,
): HeroGallerySlide[] {
  if (!item || item.type === 'single') {
    const slides: HeroGallerySlide[] = productGallery
      .filter(Boolean)
      .map((url) => ({ type: 'image', url }))
    if (video) {
      slides.push({ type: 'video', videoId: video.id, thumbUrl: video.thumbUrl })
    }
    return slides
  }
  return item.image ? [{ type: 'image', url: item.image }] : []
}

export function getGalleryPreviewUrls(slides: HeroGallerySlide[]): string[] {
  return slides.filter((s): s is Extract<HeroGallerySlide, { type: 'image' }> => s.type === 'image').map((s) => s.url)
}

export function resolveHeroSku(sku: string): string {
  const upper = (sku || '').toUpperCase()
  if (upper === 'X1-XA' || upper.toLowerCase() === 'x1-xa') return 'x1-xa'
  if (upper === 'S1P' || upper === 'S1-PRO') return 'S1P'
  if (['CY', 'LC', 'S1', 'X1', 'S1P'].includes(upper)) return upper
  if (upper.startsWith('S1P')) return 'S1P'
  if (upper === 'S1' || upper.startsWith('S1_')) return 'S1'
  if (upper === 'X1' || upper.startsWith('X1_')) return 'X1'
  return sku
}

export function getHeroDisplayConfig(sku: string): HeroDisplayConfig {
  const key = resolveHeroSku(sku)
  if (key === 'x1-xa') {
    return {
      productKey: 'other',
      title: 'SafePal X1',
      showEal6: false,
      featureTags: [],
      singleLabel: 'X1',
      hasDouble: false,
      chipSortOrder: [],
    }
  }
  return (
    HERO_CONFIG_BY_SKU[key] || {
      productKey: 'other',
      showEal6: false,
      featureTags: [],
      singleLabel: key || sku,
      hasDouble: false,
      chipSortOrder: [],
    }
  )
}

function skuToChipLabel(sku: string): string {
  if (!sku) return ''
  let normalized = sku
  if (normalized === 'Expert_choice') normalized = 'S1_CY_LC'
  if (normalized === 'S1_Leather_Case') normalized = 'S1_LC'
  return normalized
    .split('_')
    .map((part) => SKU_LABEL_MAP[part] || part)
    .join(' + ')
}

function getBundleChipLabel(item: any): string {
  if (item?.plist?.length) {
    return item.plist
      .map((p: { num: number; name: string }) => {
        const short = shortProductName(p.name)
        return p.num > 1 ? `${short} x ${p.num}` : short
      })
      .join(' + ')
  }
  const fromPlist = formatPlistLabel(item?.plist)
  if (fromPlist) return fromPlist
  return skuToChipLabel(item?.sku) || item?.title1 || item?.sku || ''
}

function getSpecialPrice(product: any): number | null {
  const found = product?.custom_attributes?.find((a: any) => a.attribute_code === 'special_price')
  if (found?.value != null && found.value !== '') return Number(found.value)
  return null
}

function sortItemsByProductOrder(items: HeroChipItem[], order: string[]): HeroChipItem[] {
  if (!order.length) return items
  return items.slice().sort((a, b) => {
    let ai = order.indexOf(a.cartSku)
    let bi = order.indexOf(b.cartSku)
    if (ai < 0) ai = Infinity
    if (bi < 0) bi = Infinity
    return ai - bi
  })
}

export function buildHeroItems(params: {
  product: any
  recommend: any[]
  sku: string
}): HeroChipItem[] {
  const { product, recommend, sku } = params
  const cfg = getHeroDisplayConfig(sku)
  const defaultSku = resolveHeroSku(sku)
  const items: HeroChipItem[] = []
  const list = Array.isArray(recommend) ? recommend : []

  if (product) {
    const regular = formatPrice(product.price)
    const special = getSpecialPrice(product)
    const zhe = special != null ? formatPrice(special) : regular
    const cartSku = product.sku || sku
    const singleImage =
      `${CDN_BASE}/${defaultSku === 'x1-xa' ? 'X1' : defaultSku}_newpage_v2.png`
    items.push({
      type: 'single',
      cartSku,
      label: cfg.singleLabel || skuToChipLabel(defaultSku) || product.name,
      image: singleImage,
      price: regular,
      zhe_price: zhe,
      hasDiscount: Number(regular) > Number(zhe),
    })
  }

  if (cfg.hasDouble && cfg.doubleCartSku && cfg.doublePriceKeys && list.length) {
    const meta = list[0] || {}
    const [pointKey, zhePriceKey, priceKey, zheLabelKey] = cfg.doublePriceKeys
    const hasDisc = meta[pointKey] && String(meta[pointKey]) !== '0'
    const price = formatPrice(meta[priceKey])
    const zhePrice = formatPrice(hasDisc ? meta[zhePriceKey] : meta[priceKey])
    items.push({
      type: 'double',
      cartSku: cfg.doubleCartSku,
      label: `${cfg.singleLabel} x 2`,
      image: cfg.doubleImage || '',
      price,
      zhe_price: zhePrice,
      discount: hasDisc ? normalizeDiscountLabel(meta[zheLabelKey]) : undefined,
      hasDiscount: !!hasDisc,
    })
  }

  list.forEach((item) => {
    if (!item?.sku) return
    if (cfg.productKey === 'leathercase' && item.sku === 'S1_Cypher') return
    if (cfg.productKey === 'cypher' && item.sku === 'S1_Leather_Case') return
    if (cfg.doubleCartSku && item.sku === cfg.doubleCartSku) return

    const hasDisc = item.zhe_point && String(item.zhe_point) !== '0'
    const rawImg = item.img || ''
    items.push({
      type: 'bundle',
      cartSku: item.sku,
      label: getBundleChipLabel(item),
      image: rawImg ? getBundleMainImg(rawImg) : cdnSkuImage(item.sku),
      price: formatPrice(item.price),
      zhe_price: formatPrice(hasDisc ? item.zhe_price : item.price),
      discount: hasDisc ? normalizeDiscountLabel(item.zhe || item.zhe_title) : undefined,
      hasDiscount: !!hasDisc,
    })
  })

  return sortItemsByProductOrder(items, cfg.chipSortOrder)
}

export function resolveDefaultActiveIndex(items: HeroChipItem[], sku: string): number {
  if (!items.length) return 0
  const target = resolveHeroSku(sku)
  const matchIndex = items.findIndex((item) => item.cartSku === target || item.cartSku === sku)
  return matchIndex >= 0 ? matchIndex : 0
}

export function getActiveDisplayPrice(item: HeroChipItem | null | undefined): string {
  if (!item) return '0.00'
  return item.hasDiscount ? item.zhe_price : item.price
}

export function getActiveSaveAmount(item: HeroChipItem | null | undefined): string | null {
  if (!item?.hasDiscount) return null
  const save = Math.max(0, Number(item.price) - Number(item.zhe_price))
  if (save <= 0) return null
  return formatMoney(save)
}
