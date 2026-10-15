import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, CenterPopup, Collapse, Mask, Rate, Stepper, Swiper } from 'antd-mobile'
import type { SwiperRef } from 'antd-mobile/es/components/swiper'
import { CloseCircleFill, CloseOutline } from 'antd-mobile-icons'
import { api } from '@/api'
import { useCartStore } from '@/stores/cart'
import { useWalletStore } from '@/stores/wallet'
import { useUiStore } from '@/stores/session'
import { onConnect } from '@/lib/connectWallet.js'
import { showLoading, hideLoading, showToast } from '@/lib/tips'
import Comment, { boostReviewCount } from './Comment'
import TrulyDecentralized from './TrulyDecentralized'
import { getProductDetailComponent } from './products'
import {
  buildHeroItems,
  getActiveDisplayPrice,
  getActiveSaveAmount,
  getGalleryPreviewUrls,
  getHeroDisplayConfig,
  getHeroGallerySlides,
  getHeroVideo,
  getStaticHeroBundles,
  resolveDefaultActiveIndex,
} from './heroHelpers'
import './index.less'

const SUPPORT_URL =
  'https://safepalsupport.zendesk.com/hc/en-us/requests/new?ticket_form_id=360001760732'

function renderTextWithLink(text: string, linkLabel: string, href: string) {
  const parts = text.split('{0}')
  if (parts.length < 2) return text
  return (
    <>
      {parts[0]}
      <a href={href} target="_blank" rel="noopener noreferrer">
        {linkLabel}
      </a>
      {parts.slice(1).join('{0}')}
    </>
  )
}

export default function DetailsPage() {
  const { sku = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const cartId = useCartStore((s) => s.cartId)
  const getCartsList = useCartStore((s) => s.getCartsList)
  const cartsTotals = useCartStore((s) => s.cartsTotals)
  const showAddToCartToast = useUiStore((s) => s.showAddToCartToast)
  const wallet = useWalletStore((s) => s.wallet)
  const setWallet = useWalletStore((s) => s.setWallet)

  const [product, setProduct] = useState<any>(null)
  const [images, setImages] = useState<string[]>([])
  const [recommend, setRecommend] = useState<any[]>([])
  const [qty, setQty] = useState(1)
  const [addLoading, setAddLoading] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [rating, setRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [videoVisible, setVideoVisible] = useState(false)
  const [videoId, setVideoId] = useState('')
  const [activeServerKey, setActiveServerKey] = useState<string | null>(null)
  const [shippingTitleOverflow, setShippingTitleOverflow] = useState(false)
  const shippingTitleRef = useRef<HTMLSpanElement>(null)
  const gallerySwiperRef = useRef<SwiperRef>(null)
  const shippingTitleText = t('common.buy_2_for_global_free_shipping')

  useLayoutEffect(() => {
    const el = shippingTitleRef.current
    if (!el) return

    const measure = () => {
      const textEl = el.querySelector('.collapse-item__title-text') as HTMLElement | null
      if (!textEl) {
        setShippingTitleOverflow(false)
        el.style.removeProperty('--scroll-distance')
        return
      }
      const distance = Math.max(0, textEl.offsetWidth - el.clientWidth)
      const overflow = distance > 1
      setShippingTitleOverflow(overflow)
      if (overflow) {
        el.style.setProperty('--scroll-distance', `${distance}px`)
      } else {
        el.style.removeProperty('--scroll-distance')
      }
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [shippingTitleText, product])

  const heroConfig = useMemo(() => getHeroDisplayConfig(sku), [sku])
  const heroVideo = useMemo(() => getHeroVideo(heroConfig.productKey), [heroConfig.productKey])

  const heroItems = useMemo(
    () => buildHeroItems({ product, recommend, sku }),
    [product, recommend, sku],
  )

  const activeItem = heroItems[activeIndex] || heroItems[0] || null
  const isCurrentSku =
    !!activeItem && activeIndex === resolveDefaultActiveIndex(heroItems, sku)
  const displayPrice = getActiveDisplayPrice(activeItem)
  const saveAmount = getActiveSaveAmount(activeItem)

  const gallerySlides = useMemo(
    () => getHeroGallerySlides(activeItem, images, heroVideo),
    [activeItem, images, heroVideo],
  )
  const previewImages = useMemo(() => getGalleryPreviewUrls(gallerySlides), [gallerySlides])
  const enableCarousel = gallerySlides.length > 1

  const openVideo = (id: string) => {
    setVideoId(id)
    setVideoVisible(true)
  }

  const closeVideo = () => {
    setVideoVisible(false)
    setVideoId('')
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      showLoading()
      try {
        const result = await api.getProductDetail(sku)
        if (cancelled) return
        setProduct(result)
        const imgs =
          result.media_gallery_entries?.map((item: any) => {
            const file = item.file.split('/').pop()
            const [name, ext] = file.split('.')
            return `https://static.isafepal.com/mshop/dev/${name}_new111_2.${ext}`
          }) || []
        setImages(imgs)

        if (sku.toLowerCase() === 'x1-xa') {
          setRecommend([])
        } else if (['CY', 'LC'].includes(sku)) {
          setRecommend(getStaticHeroBundles(sku))
        } else {
          const rec = await api.getRecommend({ sku })
          if (cancelled) return
          const list = Array.isArray(rec) ? rec : []
          setRecommend(list)
        }

        if (['CY', 'LC'].includes(sku) && result?.id) {
          const productId = String(result.id)
          void (async () => {
            try {
              const list = await api.getReviewList(
                productId,
                {
                  page: 1,
                  per_page: 1,
                  sort: 'date',
                  direction: 'desc',
                },
                { ignoreErrorPage: true },
              )
              if (cancelled) return
              const payload = list?.response ?? list ?? {}
              const stats = payload.bottomline || {}
              setRating(Number(stats.average_score) || 0)
              setReviewCount(
                (Number(stats.total_review) || 0) + boostReviewCount(productId),
              )
            } catch {
              if (cancelled) return
              setRating(5)
              setReviewCount(271)
            }
          })()
        }
      } catch (error: any) {
        if (!cancelled) showToast(error?.message || 'Load failed')
      } finally {
        hideLoading()
      }
    }
    if (sku) {
      setActiveIndex(0)
      setQty(1)
      setRating(0)
      setReviewCount(0)
      load()
    }
    return () => {
      cancelled = true
    }
  }, [sku])

  useEffect(() => {
    if (!heroItems.length) return
    setActiveIndex(resolveDefaultActiveIndex(heroItems, sku))
  }, [heroItems, sku])

  useEffect(() => {
    gallerySwiperRef.current?.swipeTo(0)
  }, [activeItem?.cartSku])

  const addToCart = async (
    targetSku?: string,
    targetQty?: number,
    options?: { skipToast?: boolean },
  ) => {
    if (!cartId) return
    const cartSku = targetSku || activeItem?.cartSku || sku
    const addQty = targetQty ?? qty
    setAddLoading(true)
    showLoading()
    try {
      await api.addItemToCart({ cartItem: { sku: cartSku, qty: addQty } }, cartId)
      await getCartsList()
      await cartsTotals()
      if (!options?.skipToast) {
        showAddToCartToast({
          name: activeItem?.label || product?.name || cartSku,
          price: getActiveDisplayPrice(activeItem),
          image: activeItem?.image || images[0],
          qty: addQty,
          sku: cartSku,
        })
      }
    } catch (error: any) {
      showToast(error?.msg || error?.message || 'Error')
    } finally {
      setAddLoading(false)
      hideLoading()
    }
  }

  const orderNow = () => {
    if (!wallet?.currentAccount) {
      setShowLogin(true)
      return
    }
    addToCart(undefined, undefined, { skipToast: true }).then(() => {
      sessionStorage.removeItem('shippingMethodRadio')
      navigate('/shopping/address')
    })
  }

  const signInWallet = async () => {
    setShowLogin(false)
    try {
      const res = await onConnect()
      if (!res) return
      setWallet(res)
      await addToCart(undefined, undefined, { skipToast: true })
      navigate('/shopping/address')
    } catch (error: any) {
      if (error?.code !== 4001) showToast(error?.msg || error?.message || 'Error')
    }
  }

  if (!product) return null

  const titleText = heroConfig.titleKey
    ? t(heroConfig.titleKey)
    : heroConfig.title || product.name
  const subtitleText = heroConfig.subtitleKey ? t(heroConfig.subtitleKey) : ''
  const DetailContent = getProductDetailComponent(heroConfig.productKey)

  return (
    <div className="details-container">
      <div className="details-hero">
        <div className={`hero-gallery${isCurrentSku ? '' : ' is-alt-sku'}`}>
          {gallerySlides.length > 0 ? (
            <Swiper
              ref={gallerySwiperRef}
              autoplay={enableCarousel}
              loop={enableCarousel}
              indicator={(total, current) =>
                total > 1 ? (
                  <div className="hero-gallery__dots">
                    {Array.from({ length: total }).map((_, i) => (
                      <span key={i} className={`hero-gallery__dot${i === current ? ' is-active' : ''}`} />
                    ))}
                  </div>
                ) : null
              }
            >
              {gallerySlides.map((slide, i) => (
                <Swiper.Item
                  key={slide.type === 'video' ? `video-${slide.videoId}` : slide.url}
                >
                  {slide.type === 'video' ? (
                    <button
                      type="button"
                      className="hero-gallery__video-trigger"
                      aria-label="Play video"
                      onClick={() => openVideo(slide.videoId)}
                    >
                      <img className="hero-gallery__img" src={slide.thumbUrl} alt="" />
                      <span className="hero-gallery__play-btn" aria-hidden="true" />
                    </button>
                  ) : (
                    <img
                      className="hero-gallery__img"
                      src={slide.url}
                      alt=""
                      onClick={() => {
                        const imgIndex = gallerySlides
                          .slice(0, i)
                          .filter((s) => s.type === 'image').length
                        setPreviewIndex(imgIndex)
                        setPreviewVisible(true)
                      }}
                    />
                  )}
                </Swiper.Item>
              ))}
            </Swiper>
          ) : null}
        </div>

        <div className="hero-header">
          <div className="hero-title-row">
            <h1 className="hero-title">{titleText}</h1>
            {heroConfig.showEal6 ? (
              <img className="hero-eal6" src="/images/icon-eal6.svg" alt="EAL 6+" />
            ) : null}
          </div>
          <div className="hero-sub-row">
            {subtitleText ? <span className="hero-subtitle">{subtitleText}</span> : null}
            {reviewCount > 0 ? (
              <div className="hero-reviews">
                <Rate readOnly allowHalf value={Math.ceil(rating)} />
                <span className="hero-reviews__text">
                  {reviewCount} {t('common.reviews')}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {heroConfig.featureTags.length > 0 ? (
          <div className="hero-feature-tags">
            <div className="hero-feature-tags__track">
              <div className="hero-feature-tags__group">
                {heroConfig.featureTags.map((tag, i) => (
                  <span key={`${tag}-${i}`} className={`hero-feature-tag${i === 0 ? ' is-accent' : ''}`}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className="hero-feature-tags__group" aria-hidden="true">
                {heroConfig.featureTags.map((tag, i) => (
                  <span
                    key={`${tag}-clone-${i}`}
                    className={`hero-feature-tag${i === 0 ? ' is-accent' : ''}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {activeItem ? (
          <div className="hero-price-banner">
            <div className="hero-price-banner__prices">
              <span className="hero-price-banner__current">${displayPrice}</span>
              {activeItem.hasDiscount ? (
                <span className="hero-price-banner__original">${activeItem.price}</span>
              ) : null}
            </div>
            {saveAmount ? (
              <span className="hero-price-banner__save">
                {t('common.save')} ${saveAmount}
              </span>
            ) : null}
          </div>
        ) : null}

        {heroItems.length > 0 ? (
          <div className="hero-bundle-list">
            <div className="hero-bundle-chips">
              {heroItems.map((item, index) => {
                const active = index === activeIndex
                return (
                  <button
                    key={`${item.cartSku}-${index}`}
                    type="button"
                    className={`hero-bundle-chip${active ? ' is-active' : ''}`}
                    onClick={() => setActiveIndex(index)}
                  >
                    <span className="hero-bundle-chip__label">{item.label}</span>
                    {item.discount ? (
                      <span className="hero-bundle-chip__discount">-{item.discount}</span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="hero-purchase">
          <div className="hero-qty">
            <Stepper defaultValue={1} min={1} value={qty} onChange={setQty} />
          </div>
          <div className="hero-purchase-actions">
            <Button
              className="hero-btn-add"
              loading={addLoading}
              color="primary"
              onClick={() => addToCart()}
            >
              {t('common.add_to_cart')}
            </Button>
            <Button className="hero-btn-order btn-accent" onClick={orderNow}>
              {t('common.order_now')}
            </Button>
          </div>
        </div>

        <div className="details-server">
          <div className="details-server-content">
            <Collapse accordion activeKey={activeServerKey} onChange={setActiveServerKey}>
              <Collapse.Panel
                key="shipping"
                title={
                  <div className="collapse-item">
                    <img className="collapse-item__img" src="/images/icon-shg-1.svg" alt="" />
                    <span
                      ref={shippingTitleRef}
                      className={`collapse-item__title collapse-item__title--scroll${
                        shippingTitleOverflow ? ' is-overflow' : ''
                      }`}
                    >
                      <span className="collapse-item__title-track">
                        <span className="collapse-item__title-text">{shippingTitleText}</span>
                      </span>
                    </span>
                  </div>
                }
              >
                <p className="details-server__content">
                  {t('common.purchase_any_2_units_or_more')}
                </p>
              </Collapse.Panel>
              <Collapse.Panel
                key="warranty"
                title={
                  <div className="collapse-item">
                    <img className="collapse-item__img" src="/images/icon-shg-2.svg" alt="" />
                    <span className="collapse-item__title">{t('common.year1_warranty')}</span>
                  </div>
                }
              >
                <p className="details-server__content">
                  {renderTextWithLink(
                    t('common.safepal_provides_a_one_year_warranty'),
                    t('common.contact'),
                    SUPPORT_URL,
                  )}
                </p>
              </Collapse.Panel>
              <Collapse.Panel
                key="support"
                title={
                  <div className="collapse-item">
                    <img className="collapse-item__img" src="/images/icon-shg-3.svg" alt="" />
                    <span className="collapse-item__title">{t('common.customer247_support')}</span>
                  </div>
                }
              >
                {/* <p className="details-server__content">
                  {renderTextWithLink(
                    t('common.safepal_provides_customers_with_247_service'),
                    t('common.contact_us'),
                    SUPPORT_URL,
                  )}
                </p> */}
                <p
                  className="details-server__content"
                  dangerouslySetInnerHTML={{
                    __html: t('common.safepal_provides_customers_with_247_service'),
                  }}
                />
              </Collapse.Panel>
            </Collapse>
          </div>
        </div>
      </div>
      {DetailContent ? <DetailContent /> : null}
      {product.id && !['LC', 'CY'].includes(sku) && (
        <div id="my-comment">
          <Comment
            productId={String(product.id)}
            sku={sku}
            onBottomline={(data) => {
              setRating(Number(data.average_score) || 0)
              setReviewCount(Number(data.total_review) || 0)
            }}
          />
        </div>
      )}
      <TrulyDecentralized />
      <CenterPopup
        visible={showLogin}
        onMaskClick={() => setShowLogin(false)}
        className="overlay-sign"
        maskStyle={{ background: 'rgba(0,0,0,.4)' }}
      >
        <div className="sign-tips">
          <div className="title">
            <span className="close" onClick={() => setShowLogin(false)}>
              <CloseOutline fontSize={20} />
            </span>
          </div>
          <div className="message">
            <p>{t('home.welcome_to_safepal_store')}</p>
            <p className="sub-title">{t('home.sign_in_wallet')}</p>
          </div>
          <div className="btn">
            <Button className="btn-switch" onClick={signInWallet}>
              {t('home.sign_in')}
            </Button>
          </div>
        </div>
      </CenterPopup>

      <Mask
        visible={previewVisible}
        onMaskClick={() => setPreviewVisible(false)}
        className="my-image-preview"
        opacity="thick"
        destroyOnClose
      >
        <button
          type="button"
          className="image-preview__close"
          aria-label="close"
          onClick={() => setPreviewVisible(false)}
        >
          <CloseCircleFill fontSize={22} />
        </button>
        <Swiper
          key={previewIndex}
          defaultIndex={previewIndex}
          loop={previewImages.length > 1}
          indicator={(total, current) =>
            total > 1 ? (
              <div className="image-preview__dots">
                {Array.from({ length: total }).map((_, i) => (
                  <span
                    key={i}
                    className={`image-preview__dot${i === current ? ' is-active' : ''}`}
                  />
                ))}
              </div>
            ) : null
          }
        >
          {previewImages.map((src, i) => (
            <Swiper.Item key={i}>
              <div className="image-preview__slide">
                <img src={src} alt="" />
              </div>
            </Swiper.Item>
          ))}
        </Swiper>
      </Mask>

      <Mask
        visible={videoVisible}
        onMaskClick={closeVideo}
        className="hero-video-modal"
        opacity="thick"
        destroyOnClose
      >
        <div className="hero-video-modal__dialog" role="dialog" aria-modal="true" aria-label="Product video">
          <button
            type="button"
            className="hero-video-modal__close"
            aria-label="Close"
            onClick={closeVideo}
          />
          <div className="hero-video-modal__body">
            {videoId ? (
              <iframe
                title="Product video"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : null}
          </div>
        </div>
      </Mask>
    </div>
  )
}
