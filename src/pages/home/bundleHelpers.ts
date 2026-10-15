export type BundleItem = {
  sku: string
  price: number
  title1: string
  title2?: string
  pop_text?: string
  free_shipping?: string
  img: string
  plist?: Array<{ num: number; name: string; img?: string }>
  zhe_point?: number
  zhe?: string
  zhe_title?: string
  zhe_price?: string | number
}

export type BundleGroupState = {
  id: string
  topTitle: string
  items: BundleItem[]
  selectedSku: string
  myQty: number
}

const NAME_SHORT: Array<[RegExp | string, string]> = [
  [/S1\s*Pro/i, 'S1 Pro'],
  [/\bS1\b/i, 'S1'],
  [/\bX1\b/i, 'X1'],
  [/Cypher/i, 'Cypher'],
  [/Leather\s*Case/i, 'Leather Case'],
]

export function shortProductName(name: string): string {
  for (const [pattern, short] of NAME_SHORT) {
    if (typeof pattern === 'string') {
      if (name.includes(pattern)) return short
    } else if (pattern.test(name)) {
      return short
    }
  }
  return name.replace(/^SafePal\s+/i, '').trim() || name
}

export function formatPlistLabelParts(plist?: BundleItem['plist']): string[] {
  if (!plist?.length) return []
  return plist.map((p) => {
    const short = shortProductName(p.name)
    return p.num > 1 ? `${short} x ${p.num}` : short
  })
}

export function formatPlistLabel(plist?: BundleItem['plist']): string {
  return formatPlistLabelParts(plist).join(' + ')
}

export function getDiscountLabel(item: BundleItem): string {
  if (!(Number(item.zhe_point) > 0)) return ''
  const raw = (item.zhe || item.zhe_title || '').trim()
  if (!raw) return ''
  return raw.replace(/^-/, '')
}

export function getDiscountPrice(item: BundleItem): number | null {
  const z = Number(item.zhe_price)
  return z > 0 ? z : null
}

export function getDisplayPrice(item: BundleItem): number {
  return getDiscountPrice(item) ?? Number(item.price) ?? 0
}

export function getSaveAmount(item: BundleItem): number | null {
  const disc = getDiscountPrice(item)
  if (disc == null) return null
  const save = Number(item.price) - disc
  return save > 0 ? save : null
}

export function formatMoney(n: number): string {
  return n.toFixed(2)
}

type TranslateFn = (key: string) => string

const BUNDLE_TOP_TITLE_KEYS: Record<string, string> = {
  'SafePal S1 Hardware Wallet': 's1.safepal_s1_hardware_wallet',
  'SafePal X1 Hardware Wallet': 'x1.safepal_x1_hardware_wallet',
  'SafePal S1 Pro Hardware Wallet': 's1p.safepal_s1_pro_hardware_wallet',
  'SafePal Cypher Seed Board': 'cy.safepal_cypher_seed_board',
  'SafePal Leather Case': 'lc.safepal_leather_case',
  'Deluxe Bundle': 'common.deluxe_bundle',
}

export function localizeBundleTopTitle(raw: string | undefined | null, t: TranslateFn): string {
  const title = (raw || '').trim()
  if (!title) return ''
  const key = BUNDLE_TOP_TITLE_KEYS[title]
  return key ? t(key) : title
}

function getBundleMainImg(img: string): string {
  if (!img) return img
  return img.replace(/(\.[a-zA-Z0-9]+)(\?.*)?$/, '_2$1$2')
}

function getBundleGroupSortKey(topTitle: string): number {
  const t = String(topTitle || '')
  if (/S1\s*Pro/i.test(t)) return 1
  if (/S1/i.test(t)) return 0
  if (/X1/i.test(t)) return 2
  return 3
}

export function normalizeBundleGroups(list: any[]): BundleGroupState[] {
  if (!Array.isArray(list)) return []
  return list
    .map((group, index) => {
      const items: BundleItem[] = Array.isArray(group?.items)
        ? group.items.map((item: any) => ({
            ...item,
            img: getBundleMainImg(item?.img ?? ''),
          }))
        : []
      const selectedSku = items[0]?.sku || `${index}`
      return {
        id: `${group?.top_title || 'group'}-${index}`,
        topTitle: group?.top_title || '',
        items,
        selectedSku,
        myQty: 1,
      }
    })
    .sort((a, b) => getBundleGroupSortKey(a.topTitle) - getBundleGroupSortKey(b.topTitle))
}
