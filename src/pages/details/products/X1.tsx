import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Rate, Swiper } from 'antd-mobile'
import type { SwiperRef } from 'antd-mobile/es/components/swiper'
import { resolveLocaleCode } from '@/i18n'
import { TOKENS_LIST } from './data/tokens'
import { LANGUAGE_ITEMS } from './data/languages'
import { TRUSTED_LIST, firstTextToImg, trustedColorAt } from './data/trusted'
import HardwareWalletsCompare from './HardwareWalletsCompare'
import './X1.less'

const COIN_LISTS_URL = 'https://www.safepal.com/coin/lists'
const RESELLER_URL = 'https://www.safepal.com/reseller'

const SOLUTION_ITEMS = [
  {
    name: 'swap',
    titleKey: 's1.cross_chain_swap_trade',
    descKey: 'x1.swap_and_exchange_between',
  },
  {
    name: 'earn',
    titleKey: 's1.one_click_to_yield_earn',
    descKey: 'x1.increase_your_passive_income',
  },
  {
    name: 'crypto',
    titleKey: 's1.easy_crypto_nft_management',
    descKey: 's1p.seamlessly_bridge_crypto',
  },
  {
    name: 'dapp',
    titleKey: 's1.powerful_dapp_gateway',
    descKey: 's1p.unlock_direct_access',
  },
] as const

function toAssetLang(lang: string): string {
  const code = resolveLocaleCode(lang)
  return code
}

function langImage(basePath: string, lang: string, ext: string, fallbackLang = 'en') {
  const code = toAssetLang(lang)
  return {
    src: `${basePath}_${code}.${ext}`,
    fallback: `${basePath}_${fallbackLang}.${ext}`,
  }
}

function ImgWithFallback({
  src,
  fallback,
  alt = '',
  className,
}: {
  src: string
  fallback: string
  alt?: string
  className?: string
}) {
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={(e) => {
        const el = e.currentTarget
        if (el.src.endsWith(fallback) || el.dataset.fallbackApplied === '1') return
        el.dataset.fallbackApplied = '1'
        el.src = fallback
      }}
    />
  )
}

export default function X1Detail() {
  const { t, i18n } = useTranslation()
  const lang = toAssetLang(i18n.language)

  const browser = langImage('/images/browser', lang, 'png')
  const bluetooth = langImage('/images/x1/high_speed_bluetooth-m', lang, 'png')
  const keypad = langImage('/images/x1/keypad_intuitive', lang, 'png')

  const posterSrc = (name: string) =>
    langImage(`/images/iphone-poster/iphone-${name}-poster`, lang, 'png')

  // —— languages ——
  const [langIndex, setLangIndex] = useState(0)
  const [langAutoplaying, setLangAutoplaying] = useState(true)
  const langSwiperRef = useRef<SwiperRef>(null)
  const langResumeTimer = useRef<ReturnType<typeof setTimeout>>()

  const pauseLangAutoplay = () => {
    setLangAutoplaying(false)
    clearTimeout(langResumeTimer.current)
    langResumeTimer.current = setTimeout(() => setLangAutoplaying(true), 3000)
  }

  const onLangBtn = (index: number) => {
    setLangIndex(index)
    langSwiperRef.current?.swipeTo(index)
    pauseLangAutoplay()
  }

  // —— solutions-via ——
  const [solutionIndex, setSolutionIndex] = useState(0)
  const [solutionPaused, setSolutionPaused] = useState(false)
  const solutionResumeTimer = useRef<ReturnType<typeof setTimeout>>()
  const solutionName = SOLUTION_ITEMS[solutionIndex].name

  useEffect(() => {
    if (solutionPaused) return
    const id = setInterval(() => {
      setSolutionIndex((i) => (i + 1) % SOLUTION_ITEMS.length)
    }, 3000)
    return () => clearInterval(id)
  }, [solutionPaused])

  const onSolutionClick = (index: number) => {
    setSolutionIndex(index)
    setSolutionPaused(true)
    clearTimeout(solutionResumeTimer.current)
    solutionResumeTimer.current = setTimeout(() => setSolutionPaused(false), 5000)
  }

  // —— trusted avatars ——
  const trustedAvatars = useMemo(() => {
    return TRUSTED_LIST.map((item, i) => firstTextToImg(item.name, 60, trustedColorAt(i)))
  }, [])

  const tokensTrack = useMemo(() => [...TOKENS_LIST, ...TOKENS_LIST], [])

  return (
    <div className="x1-detail">
      {/* comprehensive */}
      <section id="comprehensive" className="always comprehensive">
        <div className="container">
          <div className="list-item d-flex justify-content-between align-items-center flex-lg-row flex-column comprehensive-container">
            <div className="text-show order-last order-last-m">
              <div className="title">
                <h3>{t('x1.comprehensive_features')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item d-flex">
                  <div className="describe-item-point">•</div>
                  <div>{t('s1.eal_5_independent_secure_element')}</div>
                </div>
                <div className="describe-item d-flex">
                  <div className="describe-item-point">• </div>
                  <div>{t('s1.true_random_number_generator')}</div>
                </div>
                <div className="describe-item d-flex">
                  <div className="describe-item-point">• </div>
                  <div>{t('s1.smultiple_layers_of_security_sensors')}</div>
                </div>
                <div className="describe-item d-flex">
                  <div className="describe-item-point">• </div>
                  <div>{t('s1.anti_tampering_self_destruct_mechanism')}</div>
                </div>
              </div>
            </div>
            <div className="image-show order-first order-first-m">
              <img className="img-fluid" src="/images/x1/comprehensive.png" alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* opensource */}
      <section id="opensource" className="always opensource">
        <div className="container">
          <div className="list-item d-flex justify-content-between align-items-center flex-lg-row flex-column">
            <div className="text-show order-first order-last-m">
              <div className="title">
                <h3>{t('x1.first_open_sourced_bluetooth')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item">
                  <Trans
                    i18nKey="x1.maximum_transparency_trust"
                    components={[
                      <a
                        style={{ color: '#4A21EF',textDecorationLine: "underline" }}
                        href="https://www.safepal.com/blog/safepal-x1-open-source-wallet-suite"
                        target="_blank"
                        rel="noopener noreferrer"
                      />,
                    ]}
                  />
                </div>
              </div>
            </div>
            <div className="image-show image-show-ownBank order-last order-first-m">
              <img className="img-fluid" src="/images/x1/opensource.png" alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* improved — high-speed bluetooth */}
      <section id="improved" className="always improved">
        <div className="container">
          <div className="list-item d-flex justify-content-between align-items-center flex-lg-row flex-column">
            <div className="text-show order-last order-last-m">
              <div className="title">
                <h3>{t('x1.high_speed_bluetooth_signing')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item describe-item1 d-flex align-items-center">
                  <div>{t('x1.bluetooth5_connectivity_enables')}</div>
                </div>
              </div>
            </div>
            <div className="position-relative image-show order-first order-first-m">
              <ImgWithFallback
                className="img-fluid bodyImg"
                src={bluetooth.src}
                fallback={bluetooth.fallback}
              />
            </div>
          </div>
        </div>
      </section>

      {/* keypadIntuitive */}
      <section id="keypadIntuitive" className="always keypadIntuitive">
        <div className="container">
          <div className="list-item d-flex justify-content-between align-items-center flex-lg-row flex-column">
            <div className="text-show order-first order-last-m">
              <div className="title">
                <h3>{t('x1.keypad_intuitive')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item d-flex">{t('x1.keypad_intuitive_dec')}</div>
              </div>
            </div>
            <div className="image-show image-show-ownBank order-last order-first-m">
              <ImgWithFallback className="img-fluid" src={keypad.src} fallback={keypad.fallback} />
            </div>
          </div>
        </div>
      </section>

      {/* largerScreen */}
      <section id="largerScreen" className="always largerScreen">
        <div className="container list">
          <div className="list-item  d-flex justify-content-between align-items-center flex-lg-row flex-column">
            <div className="text-show text-show1 text-box order-last order-last-m">
              <div className="title">
                <h3>{t('x1.larger_screen_with_improved')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item d-flex">
                  <p>{t('x1.monochrome_resolution_details')}</p>
                </div>
                <div className="describe-item d-flex">
                  <p>{t('x1.levels3_of_backlight')}</p>
                </div>
              </div>
            </div>
            <div className="position-relative image-show order-first order-first-m">
              <img
                className="img-fluid bodyImg"
                src="/images/x1/larger_screen_improved.png"
                alt=""
              />
            </div>
          </div>
        </div>
      </section>

      {/* tokens */}
      <section id="tokens">
        <div className="container">
          <h1>{t('s1.manage_unlimited_tokens')}</h1>
          <div className="d-flex flex-lg-row flex-column textBox">
            <div className="describe-item d-flex align-items-center justify-content-center goAssets">
              <a href={COIN_LISTS_URL} target="_blank" rel="noopener noreferrer">
                <div>{t('s1.view_all_supported_assets_here')}</div>
              </a>
            </div>
          </div>
          <div className="tokens-marquee">
            <div className="tokens-marquee__track">
              {tokensTrack.map((item, i) => (
                <div
                  key={`${item.name}-${i}`}
                  className="tokens-item"
                  title={item.name}
                  aria-hidden={i >= TOKENS_LIST.length ? true : undefined}
                >
                  <div className="tokens-icon">
                    <img src={item.icon} alt={i < TOKENS_LIST.length ? item.name : ''} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* languages */}
      <section id="languages" className={`languages${langAutoplaying ? ' is-autoplaying' : ''}`}>
        <div className="container">
          <div className="languages__header languages__header_m">
            <h3>{t('s1p.global_accessibility')}</h3>
          </div>
          <div className="languages__body">
            <div className="languages__preview" aria-live="polite">
              <div className="languages__device languages__device_x1">
                <Swiper
                  ref={langSwiperRef}
                  loop
                  autoplay={langAutoplaying}
                  autoplayInterval={3000}
                  allowTouchMove
                  defaultIndex={0}
                  onIndexChange={(i) => setLangIndex(i)}
                  indicator={false}
                >
                  {LANGUAGE_ITEMS.map((item) => {
                    const img = langImage('/images/x1/x1_multi_language', item.code, 'png')
                    return (
                      <Swiper.Item key={item.code}>
                        <ImgWithFallback
                          className="languages__screen"
                          src={img.src}
                          fallback={img.fallback}
                        />
                      </Swiper.Item>
                    )
                  })}
                </Swiper>
              </div>
            </div>
            <div className="languages__left">
              <div className="languages__grid" role="list">
                {LANGUAGE_ITEMS.map((item, i) => (
                  <button
                    key={item.code}
                    type="button"
                    className={`languages__btn${i === langIndex ? ' is-active' : ''}`}
                    role="listitem"
                    onClick={() => onLangBtn(i)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* solutions-via */}
      <section className="always" id="solutions-via">
        <div className="solutionsvia-box container list-item">
          <div className="container position-relative solutionsvia-content d-flex justify-content-center align-items-center flex-column">
            <div className="text-show">
              <div className="title">
                <h3>{t('s1p.enjoy_powerful_add')}</h3>
              </div>
            </div>
            <div className="solutionsvia-bottom d-flex justify-content-center align-items-center flex-lg-row flex-column">
              <div
                id="solutionsvia-swiper-img"
                className="order-first order-last-m solutionsvia-bottom-item item-left"
              >
                {(['crypto', 'dapp', 'swap', 'earn'] as const).map((name) => {
                  const img = posterSrc(name)
                  return (
                    <ImgWithFallback
                      key={name}
                      className={`img-fluid swiper-img${solutionName !== name ? ' d-none' : ''}`}
                      src={img.src}
                      fallback={img.fallback}
                    />
                  )
                })}
              </div>
              <div
                id="solutionsvia-swiper"
                className="order-last order-first-m solutionsvia-bottom-item item-right"
              >
                <div className="swiper-wrapper">
                  {SOLUTION_ITEMS.map((item, index) => (
                    <button
                      type="button"
                      key={item.name}
                      className={`item-right-item swiper-slide${
                        solutionIndex === index ? ' selected' : ''
                      }`}
                      data-name={item.name}
                      onClick={() => onSolutionClick(index)}
                    >
                      <h3>{t(item.titleKey)}</h3>
                      <p>{t(item.descKey)}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* connectExtension */}
      <section id="connectExtension" className="always connectExtension">
        <div className="container list">
          <div className="list-item d-flex justify-content-between align-items-center flex-lg-row flex-column">
            <div className="text-show">
              <div className="title">
                <h3>{t('s1p.securely_sync_with')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item describe-item1 d-flex align-items-center">
                  {t('s1p.securely_sync_with_text1')}
                </div>
                <div className="describe-item describe-item1 d-flex align-items-center">
                  {t('s1p.securely_sync_with_text2')}
                </div>
              </div>
            </div>
            <div className="position-relative">
              <ImgWithFallback className="img-fluid bodyImg" src={browser.src} fallback={browser.fallback} />
            </div>
          </div>
        </div>
      </section>

      {/* discover / trusted */}
      <section id="discover" className="always choose_device">
        <div className="trustedBox">
          <div className="container list-item discover-item mgb30">
            <div className="title-top text-show">
              <div className="title">
                <h3>{t('s1.trusted_by_customers_from_more_than')}</h3>
              </div>
            </div>
          </div>
          <div className="content-box">
            <div className="trusted-list trusted-slider">
              <Swiper
                loop
                autoplay={false}
                autoplayInterval={3000}
                slideSize={94}
                trackOffset={0}
                indicator={false}
                stuckAtBoundary={false}
              >
                {TRUSTED_LIST.map((item, index) => (
                  <Swiper.Item key={item.name}>
                    <div className="trusted-item is_mobile">
                      <div className="character-info d-flex justify-content-start align-items-center">
                        <div className="avatar">
                          <img
                            className="img-fluid rounded-circle"
                            src={trustedAvatars[index]}
                            alt=""
                          />
                        </div>
                        <div className="info">
                          <h3 className="name">{item.name}</h3>
                          <div className="raty">
                            <Rate
                              readOnly
                              value={item.score}
                              style={
                                {
                                  '--star-size': '16px',
                                  '--active-color': '#F4C63E',
                                } as CSSProperties
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className="describe">
                        <h3>{item.title}</h3>
                        <p>{item.comment}</p>
                      </div>
                    </div>
                  </Swiper.Item>
                ))}
              </Swiper>
            </div>
          </div>
        </div>
      </section>

      {/* backedby */}
      <section id="backedby" className="always backedby">
        <div className="container">
          <div className="list-item">
            <div className="titleBox d-flex text-show">
              <div className="title">
                <h3 className="text-center">{t('s1p.backed_by_the_best')}</h3>
              </div>
            </div>
            <div className="d-flex imgBox">
              <div className="item">
                <img src="/images/s1pro/binance_labs.png" alt="" />
              </div>
              <div className="item item2">
                <img src="/images/s1pro/animocaBrands.png" alt="" />
              </div>
              <div className="item">
                <img src="/images/s1pro/superscrypt.png" alt="" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* inside-box */}
      <section className="position-relative always" id="inside-box">
        <div className="inside-box-main">
          <div className="container inside-box d-flex justify-content-center align-items-center flex-column list-item">
            <div className="text-show inside-box-item">
              <div className="title">
                <h3>{t('s1.specifications')}</h3>
              </div>
              <div className="box box-left-right">
                <div className="box-left d-flex">
                  <div className="box-left-item">
                    <div className="titleBox">
                      <img src="/images/x1/inside_temperature.svg" alt="" />
                      <div className="title-item">
                        <h3>{t('s1.operation_temperature')}</h3>
                        <p>{t('x1.4to122f')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="box-left-item">
                    <div className="titleBox">
                      <img src="/images/x1/inside_display.svg" alt="" />
                      <div className="title-item">
                        <h3>{t('s1p.display')}</h3>
                        <p>{t('x1.monochrome_resolution_LCD_screen')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="box-left-item">
                    <div className="titleBox">
                      <img src="/images/x1/inside_button.svg" alt="" />
                      <div className="title-item">
                        <h3>{t('x1.fingerboard')}</h3>
                        <p>{t('x1.buttons12_dpad')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="box-left-item">
                    <div className="titleBox align-items-start">
                      <img src="/images/s1pro/battery.svg" alt="" />
                      <div className="title-item">
                        <h3>{t('s1.power')}</h3>
                        <div>
                          <div className="describe-item d-flex" style={{ marginBottom: 10 }}>
                            <p style={{ margin: '0 10px' }} className="describe-item-point">
                              •{' '}
                            </p>
                            <p>{t('x1.built_in_200mAh_battery')}</p>
                          </div>
                          <div className="describe-item d-flex">
                            <p style={{ margin: '0 10px' }} className="describe-item-point">
                              •{' '}
                            </p>
                            <p>{t('s1p.charged_with_usb_cable')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="box-left-item">
                    <div className="titleBox">
                      <img src="/images/s1pro/connection.svg" alt="" />
                      <div className="title-item">
                        <h3>{t('s1.connectivity')}</h3>
                        <p>{t('x1.high_speed_bluetooth5')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="box-left-item">
                    <div className="titleBox">
                      <img src="/images/s1pro/upgrade.svg" alt="" />
                      <div className="title-item">
                        <h3>{t('s1.product_upgrade')}</h3>
                        <p>{t('s1.support_firmware_upgrade')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-show inside-box-item box-what-inside">
              <div className="title">
                <h3 className="text-center text-lg-start">{t('s1.what_inside_the_box')}</h3>
              </div>
              <div className="box">
                <div className="box-grid">
                  <div className="grid-item">
                    <img
                      className="img-fluid insidebox-item-x1"
                      src="/images/x1/inside_box_x1.svg"
                      alt=""
                    />
                    <p>{t('x1.safepal_x1_hardware_wallet_1')}</p>
                  </div>
                  <div className="grid-item">
                    <img className="img-fluid" src="/images/x1/inside_box_cleaning.svg" alt="" />
                    <p>{t('s1.cleaning_cloth')}</p>
                  </div>
                  <div className="grid-item">
                    <img
                      className="img-fluid"
                      src="/images/x1/inside_box_mnemonic_card.svg"
                      alt=""
                    />
                    <p>{t('s1.mnemonic_phrase_card')}</p>
                  </div>
                  <div className="grid-item">
                    <img
                      className="img-fluid"
                      src="/images/x1/inside_box_user_manual.svg"
                      alt=""
                    />
                    <p>{t('s1.user_manual')}</p>
                  </div>
                  <div className="grid-item">
                    <img
                      className="img-fluid"
                      src="/images/x1/inside_box_download_app_card.svg"
                      alt=""
                    />
                    <p>{t('s1.download_app_card')}</p>
                  </div>
                  <div className="grid-item justify-content-around flex-row-i">
                    <div
                      style={{ width: '50%', height: '100%' }}
                      className="d-flex justify-content-end align-items-center flex-column"
                    >
                      <img className="img-fluid" src="/images/x1/inside_box_sticker.svg" alt="" />
                      <p>{t('s1.sticker')}</p>
                    </div>
                    <div
                      style={{ width: '50%', height: '100%' }}
                      className="d-flex justify-content-end align-items-center flex-column"
                    >
                      <img
                        style={{ width: 'auto' }}
                        className="img-fluid"
                        src="/images/s1/inside_box_usb_cable_m.svg"
                        alt=""
                      />
                      <p>{t('s1.usb_cable')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* countries-regions */}
      <section id="countries-regions" className="always countries-regions">
        <div className="container list-item countries-regions-box">
          <div className="title">
            <h3>{t('s1.extensive_reseller_network')}</h3>
            <a style={{ color: '#4A21EF' }} target="_blank" rel="noopener noreferrer" href={RESELLER_URL}>
              {t('s1.view_other_official_purchasing')}
            </a>
          </div>
          <div className="content-box">
            <img src="/images/s1/countries-regions-m.png" alt="" />
          </div>
        </div>
      </section>

      {/* hardware compare */}
      <section id="hardware-wallets-compare" className="always hardware-wallets-compare">
        <HardwareWalletsCompare
          prioritySku="X1"
          titleKey="s1p.you_may_also_like"
          fixedBarEndSelector="#my-comment"
        />
      </section>
    </div>
  )
}
