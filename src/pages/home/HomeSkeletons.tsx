import { Skeleton } from 'antd-mobile'

const PRODUCT_SKELETON_COUNT = 5
const BUNDLE_SKELETON_COUNT = 2

export function BannerSkeleton() {
  return <Skeleton animated className="safepalstore-img-skeleton" />
}

export function ProductListSkeleton() {
  return (
    <>
      {Array.from({ length: PRODUCT_SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="product-card product-card-skeleton">
          <div className="items-box">
            <div className="title">
              <Skeleton.Title animated />
            </div>
            <div className="describe">
              <Skeleton.Paragraph animated lineCount={2} />
            </div>
            <div className="image">
              <Skeleton animated className="product-img-skeleton" />
            </div>
            <div className="price-learn">
              <Skeleton animated className="price-skeleton" />
              <Skeleton animated className="btn-skeleton" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export function BundleListSkeleton() {
  return (
    <>
      {Array.from({ length: BUNDLE_SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="bundle-content bundle-skeleton">
          <Skeleton animated className="bundle-top-title-skeleton" />
          <div className="recommend-bundle-card">
            <div className="bundle-image">
              <Skeleton animated className="bundle-img-skeleton" />
            </div>
            <div className="bundle-title-row">
              <Skeleton animated className="bundle-title-skeleton" />
            </div>
            <div className="bundle-price-row">
              <Skeleton animated className="bundle-price-skeleton" />
            </div>
            <div className="bundle-chips">
              <Skeleton animated className="bundle-chip-skeleton" />
              <Skeleton animated className="bundle-chip-skeleton" />
              <Skeleton animated className="bundle-chip-skeleton short" />
            </div>
            <div className="bundle-footer">
              <Skeleton animated className="bundle-stepper-skeleton" />
              <Skeleton animated className="bundle-btn-skeleton" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
