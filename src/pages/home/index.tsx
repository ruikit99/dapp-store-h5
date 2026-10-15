import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Image } from 'antd-mobile'
import { api } from '@/api'
import { useCartStore } from '@/stores/cart'
import { useUiStore } from '@/stores/session'
import { showLoading, hideLoading, showToast } from '@/lib/tips'
import RecommendBundleCard from './RecommendBundleCard'
import { BannerSkeleton, BundleListSkeleton, ProductListSkeleton } from './HomeSkeletons'
import { type BundleGroupState, formatMoney, getDisplayPrice, normalizeBundleGroups } from './bundleHelpers'
import './index.less'

const SKU_ORDER = ['S1', 'X1', 'S1P', 'CY', 'LC']

function getCover(item: any) {
  const imgUrl = item?.media_gallery_entries?.[0]?.file || ''
  try {
    if (!imgUrl) throw new Error('no image')
    const filename = imgUrl.split('/').pop()
    return `https://static.isafepal.com/mshop/dev/${filename}`
  } catch {
    return `https://static.isafepal.com/mshop/dev/${item.sku}.png`
  }
}

function getSpecialPrice(item: any) {
  const attrs = item?.custom_attributes
  const found = attrs?.find((a: any) => a.attribute_code === 'special_price')
  if (found?.value) return (found.value - 0).toFixed(2)
  return null
}

export default function HomePage() {
  const { t } = useTranslation()
  const cartId = useCartStore((s) => s.cartId)
  const getCartsList = useCartStore((s) => s.getCartsList)
  const cartsTotals = useCartStore((s) => s.cartsTotals)
  const showAddToCartToast = useUiStore((s) => s.showAddToCartToast)
  const [list, setList] = useState<any[]>([])
  const [bundleGroups, setBundleGroups] = useState<BundleGroupState[]>([])
  const [addLoading, setAddLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      showLoading()
      try {
        const [products, rec] = await Promise.all([
          api.getProducts(),
          api.getAllGroupProductListForNewPage(),
        ])
        const items = products?.items || []
        const sorted: any[] = []
        SKU_ORDER.forEach((sku) => {
          const idx = items.findIndex((k: any) => k.sku === sku)
          if (idx > -1) sorted.push(items.splice(idx, 1)[0])
        })
        sorted.push(...items)
        setList(sorted.filter((i) => SKU_ORDER.includes(i.sku)))
        const rawList = rec?.data?.list ?? rec?.list ?? []
        setBundleGroups(normalizeBundleGroups(rawList))
      } catch (error: any) {
        showToast(error?.message || 'Load failed')
      } finally {
        setPageLoading(false)
        hideLoading()
      }
    }
    load()
  }, [])

  const showList = useMemo(() => {
    const describeText = [
      {
        sku: 'S1',
        name: t('s1.safepal_s1_hardware_wallet'),
        describe: t('home.s1_describe'),
        desPoint: [t('home.s1_des_point1'), t('home.s1_des_point2'), t('home.s1_des_point3')],
      },
      { sku: 'CY', name: t('cy.safepal_cypher_seed_board'), describe: t('home.cy_describe') },
      { sku: 'LC', name: t('lc.safepal_leather_case'), describe: t('home.lc_describe') },
      { sku: 'X1', name: t('x1.safepal_x1_hardware_wallet'), describe: t('home.x1_describe') },
      { sku: 'S1P', name: t('s1p.safepal_s1_pro_hardware_wallet'), describe: t('home.s1p_describe') },
    ]
    return list.map((item) => {
      const meta = describeText.find((d) => d.sku === item.sku)
      return meta ? { ...item, ...meta } : item
    })
  }, [list, t])

  const addToCart = async (sku: string, qty: number) => {
    if (!cartId) return
    setAddLoading(true)
    showLoading()
    try {
      await api.addItemToCart({ cartItem: { sku, qty } }, cartId)
      await getCartsList()
      await cartsTotals()
      const selected = bundleGroups.flatMap((g) => g.items).find((i) => i.sku === sku)
      showAddToCartToast({
        name: selected?.title1 || sku,
        price: selected ? formatMoney(getDisplayPrice(selected)) : '',
        image: selected?.img,
        qty,
        sku,
      })
    } catch (error: any) {
      showToast(error?.msg || error?.message || 'Error')
    } finally {
      setAddLoading(false)
      hideLoading()
    }
  }

  const updateGroup = (id: string, patch: Partial<BundleGroupState>) => {
    setBundleGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  }

  return (
    <div className="home-container page-container">
      <div className="safepalstore-img">
        <Image
          src="https://static.isafepal.com/plaza/safepalstore_2.png"
          width="100%"
          placeholder={<BannerSkeleton />}
        />
      </div>
      <div className="items">
        {pageLoading ? (
          <ProductListSkeleton />
        ) : (
          showList.map((item) => {
            const cover = getCover(item)
            const specialPrice = getSpecialPrice(item)
            return (
              <Link key={item.sku} to={`/details/${item.sku}`} className="product-card">
                <div className="items-box">
                  <div className="title">
                    <h3>{item.name}</h3>
                  </div>
                  <div className="describe">
                    <p>{item.describe}</p>
                  </div>
                  {item.desPoint?.length > 0 && (
                    <div className="describe-item">
                      <ul className="describe-item-ul">
                        {item.desPoint.map((text: string, i: number) => (
                          <li key={i} className="describe-item-li">{text}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="image">
                    <img src={cover} alt={item.name} />
                  </div>
                  <div className="price-learn">
                    <div className="price">
                      <div className="now">
                        <p>${specialPrice ?? item.price}</p>
                      </div>
                      {specialPrice && (
                        <div className="old">
                          <p>${item.price}</p>
                        </div>
                      )}
                    </div>
                    <div className="learn">
                      <Button className="btn-learn" shape="rounded">{t('common.learn_more')}</Button>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
      <div className="recommend">
        <h3 className="title">{t('common.recommended_bundles')}</h3>
        <div className="recommend-content">
          {pageLoading ? (
            <BundleListSkeleton />
          ) : (
            bundleGroups.map((group) => (
              <RecommendBundleCard
                key={group.id}
                group={group}
                addLoading={addLoading}
                onSelectSku={(sku) => updateGroup(group.id, { selectedSku: sku })}
                onQtyChange={(qty) => updateGroup(group.id, { myQty: qty })}
                onAddToCart={addToCart}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
