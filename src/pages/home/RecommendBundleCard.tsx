import { Fragment } from 'react'
import { Button, Stepper, Image } from 'antd-mobile'
import { useTranslation } from 'react-i18next'
import {
  type BundleGroupState,
  type BundleItem,
  formatMoney,
  formatPlistLabelParts,
  getDiscountLabel,
  getDisplayPrice,
  getSaveAmount,
  localizeBundleTopTitle,
} from './bundleHelpers'
import './RecommendBundleCard.less'

type Props = {
  group: BundleGroupState
  addLoading: boolean
  onSelectSku: (sku: string) => void
  onQtyChange: (qty: number) => void
  onAddToCart: (sku: string, qty: number) => void
}

function findSelected(group: BundleGroupState): BundleItem | undefined {
  return group.items.find((i) => i.sku === group.selectedSku) || group.items[0]
}

export default function RecommendBundleCard({
  group,
  addLoading,
  onSelectSku,
  onQtyChange,
  onAddToCart,
}: Props) {
  const { t } = useTranslation()
  const selected = findSelected(group)
  if (!selected) return null

  const displayPrice = getDisplayPrice(selected)
  const saveAmount = getSaveAmount(selected)
  const hasFreeShipping = Boolean(selected.free_shipping?.trim())
  const hasDiscount = saveAmount != null
  const displayTopTitle = localizeBundleTopTitle(group.topTitle, t)
  const titleMap: Record<string, string> = {
    "Expert's Choice": t('common.expert_choice'),
    'Backup Package': t('common.backup_package'),
    'Hardcore Bundle': t('common.hardcore_bundle'),
    'Standard Package': t('common.standard_package'),
    'Expert Bundle': t('common.expert_Bundle'),
    'Ultra-Deluxe Bundle': t('common.ultra_deluxe_bundle'),
    'Deluxe Bundle': t('common.expert_Bundle'),
  }
  const displayTitle = titleMap[selected.title1?.trim()] || selected.title1

  return (
    <div className="bundle-content">
      {displayTopTitle ? <p className="bundle-top-title">{displayTopTitle}</p> : null}
      <div className="recommend-bundle-card">
      <div className="bundle-image">
        <img
          src={selected.img}
          alt={displayTitle}
        />
      </div>

      <div className="bundle-title-row">
        <h3 className="bundle-title">{displayTitle}</h3>
        {hasFreeShipping ? (
          <span className="bundle-free-shipping">{t('common.free_shipping')}</span>
        ) : null}
      </div>

      <div className="bundle-price-row">
        <span className="price-now">${formatMoney(displayPrice)}</span>
        {hasDiscount ? (
          <>
            <span className="price-old">${formatMoney(Number(selected.price))}</span>
            <span className="price-save">
              {t('common.save').toLowerCase()} ${formatMoney(saveAmount)}
            </span>
          </>
        ) : null}
      </div>

      <div className="bundle-chips">
        {group.items.map((item) => {
          const parts = formatPlistLabelParts(item.plist)
          const discount = getDiscountLabel(item)
          const active = item.sku === selected.sku
          return (
            <button
              key={item.sku}
              type="button"
              className={`bundle-chip${active ? ' is-active' : ''}`}
              onClick={() => onSelectSku(item.sku)}
            >
              <span className={`chip-label ${item.sku}`}>
                {parts.length > 0 ? (
                  parts.map((name, i) => (
                    <Fragment key={`${item.sku}-${i}`}>
                      {i > 0 ? <span className="chip-plus"> + </span> : null}
                      <span className="chip-name">{name}</span>
                    </Fragment>
                  ))
                ) : (
                  <span className="chip-name">{item.title1}</span>
                )}
              </span>
              {discount ? <span className="chip-discount">-{discount}</span> : null}
            </button>
          )
        })}
      </div>

      <div className="bundle-footer">
        <div className="bundle-stepper">
          <Stepper min={1} max={1000} value={group.myQty} onChange={(v) => onQtyChange(v)} />
        </div>
        <div className="bundle-add-btn">
          <Button
            block
            loading={addLoading}
            onClick={() => onAddToCart(selected.sku, group.myQty)}
          >
            {t('common.add_to_cart')}
          </Button>
        </div>
      </div>
      </div>
    </div>
  )
}
