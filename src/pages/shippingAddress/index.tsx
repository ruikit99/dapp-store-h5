import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { resolveLocaleCode } from '@/i18n'
import { Button, Dialog, Divider, Form, Input, Popup, Radio } from 'antd-mobile'
import { api } from '@/api'
import { useCartStore, getCouponHeader } from '@/stores/cart'
import CountryProvinceSelect, {
  buildEstimateAddressPayload,
  buildShippingInformationPayload,
  type BillingAddressForm,
  type CountryItem,
  type ProvinceItem,
} from '@/components/CountryProvinceSelect'
import LogisticsTips, { findShippingMethod, type ShippingMethod } from '@/components/LogisticsTips'
import HintIcon from '@/components/HintIcon'
import { showLoading, hideLoading, showToast } from '@/lib/tips'
import {
  EMAIL_PATTERN,
  formatter,
  hasChineseChars,
  hasMinChineseChars,
  isChineseName,
  isEoriVatCountry,
  isPostalCodeOptional,
  isTwRegion,
  isValidBrTax,
  isValidClTax,
  isValidCnPhone,
  isValidIntlPhone,
  isValidPostalCode,
  isValidTrPid,
  isValidTwPid,
  isValidZaPid,
  needsChineseHint,
  needsChineseNameValidation,
  needsChineseValidation,
  scrollToFirstFormError,
  shouldShowPoBoxHint,
} from '@/lib/formUtils'
import './index.less'

const SKU_NAME_KEYS: Record<string, string> = {
  S1: 's1.safepal_s1_hardware_wallet',
  X1: 'x1.safepal_x1_hardware_wallet',
  'X1-C': 'x1.safepal_x1c_hardware_wallet',
  'X1-BK': 'x1.safepal_x1c_hardware_wallet',
  'X1-1inch': 'x1.safepal_x1_hardware_wallet',
  S1P: 's1p.safepal_s1_pro_hardware_wallet',
  CY: 'cy.safepal_cypher_seed_board',
  LC: 'lc.safepal_leather_case',
}

export default function ShippingAddressPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const cartId = useCartStore((s) => s.cartId)
  const carts = useCartStore((s) => s.carts)
  const cartsTotal = useCartStore((s) => s.cartsTotal)
  const getCartsList = useCartStore((s) => s.getCartsList)
  const cartsTotals = useCartStore((s) => s.cartsTotals)

  const [form] = Form.useForm()
  const [country, setCountry] = useState<CountryItem | null>(null)
  const [province, setProvince] = useState<ProvinceItem | null>(null)
  const [restoredCountryId, setRestoredCountryId] = useState<string | undefined>()
  const [restoredProvinceId, setRestoredProvinceId] = useState<string | undefined>()
  const [provinceText, setProvinceText] = useState('')
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [shippingMethodCode, setShippingMethodCode] = useState('')
  const [listShow, setListShow] = useState(false)
  const [radiosBilling, setRadiosBilling] = useState<'same' | 'different'>('same')
  const [billingCountry, setBillingCountry] = useState<CountryItem | null>(null)
  const [billingProvince, setBillingProvince] = useState<ProvinceItem | null>(null)
  const [billingCountryId, setBillingCountryId] = useState<string | undefined>()
  const [billingProvinceId, setBillingProvinceId] = useState<string | undefined>()
  const [billingProvinceText, setBillingProvinceText] = useState('')
  const [eoriVatTaxNumber, setEoriVatTaxNumber] = useState('')
  const [vatIdIn, setVatIdIn] = useState('')
  const [zipCodeHasChange, setZipCodeHasChange] = useState(false)
  const emptyCartChecked = useRef(false)

  const countryId = country?.id
  const provinceId = province?.id ? `${province.id}` : ''

  const isTw = useMemo(() => isTwRegion(countryId, provinceId), [countryId, provinceId])
  const isShowPID = useMemo(
    () => ['TR', 'TW', 'ZA'].includes(countryId || '') || provinceId === '705',
    [countryId, provinceId],
  )
  const isShowTax = useMemo(() => ['BR', 'CL'].includes(countryId || ''), [countryId])
  const isBR = countryId === 'BR'
  const isZA = countryId === 'ZA'
  const eoriVat = useMemo(() => isEoriVatCountry(countryId), [countryId])
  const needCnValidation = useMemo(
    () => needsChineseValidation(countryId, provinceId),
    [countryId, provinceId],
  )
  const needCnNameValidation = useMemo(
    () => needsChineseNameValidation(countryId, provinceId),
    [countryId, provinceId],
  )
  const showCnHint = useMemo(() => needsChineseHint(countryId, provinceId), [countryId, provinceId])
  const showPoBoxHint = useMemo(() => shouldShowPoBoxHint(countryId), [countryId])
  const postalOptional = useMemo(
    () => isPostalCodeOptional(countryId, provinceId),
    [countryId, provinceId],
  )
  const trAndItemsQtyMoreThan4 = useMemo(
    () => Number(cartsTotal?.items_qty) > 4 && countryId === 'TR',
    [cartsTotal?.items_qty, countryId],
  )
  const hasShippingMethods = shippingMethods.length > 0
  const { zhe_point, zhe_price, subtotal, base_subtotal } = cartsTotal || {}
  const hasZheDiscount =
    zhe_point != null &&
    zhe_price != null &&
    `${zhe_point}` !== '0' &&
    `${zhe_price}` !== `${subtotal}`
  const isChineseLocale = useMemo(
    () => ['zh-cn', 'zh-tc'].includes(resolveLocaleCode(i18n.language)),
    [i18n.language],
  )

  const renderShoppingListPrice = () => {
    if (hasZheDiscount) {
      return (
        <>
          <span className="hasDiscount">$</span>
          <span style={{ paddingLeft: '3px' }}>{zhe_price}</span>
          <span
            style={{
              fontSize: '12px',
              marginLeft: '4px',
              color: '#C3BAE7',
              textDecoration: 'line-through',
            }}
          >
            ${subtotal}
          </span>
        </>
      )
    }
    if (subtotal === base_subtotal) {
      return (
        <>
          <span>$</span>
          <span style={{ paddingLeft: '3px' }}>{subtotal}</span>
        </>
      )
    }
    return (
      <>
        <span>$</span>
        <span style={{ paddingLeft: '3px' }}>{base_subtotal}</span>
        <span
          style={{
            fontSize: '12px',
            marginLeft: '4px',
            color: '#FF453A',
            textDecoration: 'line-through',
          }}
        >
          (${subtotal})
        </span>
      </>
    )
  }

  const cartsImgList = useMemo(
    () => carts.map((c) => `https://static.isafepal.com/mshop/dev/${c.sku}.png`),
    [carts],
  )

  const showList = useMemo(
    () =>
      carts.map((item) => ({
        ...item,
        name: SKU_NAME_KEYS[item.sku] ? t(SKU_NAME_KEYS[item.sku]) : item.name,
      })),
    [carts, t],
  )

  const twPersonalIdTips = useCallback(() => {
    Dialog.alert({
      content: t('checkout.tw_clearance_tips'),
      confirmText: 'OK',
    })
  }, [t])

  const resolveVatId = useCallback(() => {
    if (eoriVat && shippingMethodCode === 'express_delivery') return eoriVatTaxNumber
    if (shippingMethodCode === 'express_delivery' && ['ID', 'IN'].includes(countryId || '')) {
      return vatIdIn || form.getFieldValue('identificationInId') || ''
    }
    return form.getFieldValue('taxNumber') || ''
  }, [eoriVat, shippingMethodCode, eoriVatTaxNumber, vatIdIn, countryId, form])

  const estimateShipping = useCallback(async () => {
    if (!cartId || !country) return
    if (trAndItemsQtyMoreThan4) {
      setShippingMethods([])
      setShippingMethodCode('')
      return
    }
    const values = form.getFieldsValue(true)
    const payload = buildEstimateAddressPayload(values, country, province, {
      vatId: resolveVatId(),
      identification: values.identification,
    })
    showLoading()
    try {
      const couponHeader = getCouponHeader()
      const methods: any = await api.estimateShippingMethods(cartId, payload, couponHeader)
      const list = (methods || []) as ShippingMethod[]
      setShippingMethods(list)
      const saved = sessionStorage.getItem('shippingMethodRadio')
      const match = saved ? list.find((m) => m.method_code === saved) : undefined
      setShippingMethodCode(match?.method_code || list[0]?.method_code || '')
    } catch (error: any) {
      showToast(error?.message || 'Estimate failed')
      setShippingMethods([])
      setShippingMethodCode('')
    } finally {
      hideLoading()
    }
  }, [cartId, country, province, form, trAndItemsQtyMoreThan4, resolveVatId])

  useEffect(() => {
    if (cartId) {
      getCartsList().then((list) => {
        if (emptyCartChecked.current) return
        emptyCartChecked.current = true
        if (!list?.length) {
          Dialog.alert({
            content: t('checkout.shopping_cart_have_expired'),
            confirmText: 'OK',
          }).then(() => navigate('/', { replace: true }))
        }
      })
      cartsTotals()
    }
    const saved = localStorage.getItem('shipping')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        form.setFieldsValue(data)
        if (data.countryId) setRestoredCountryId(data.countryId)
        if (data.provinceId) setRestoredProvinceId(data.provinceId)
        if (data.province) setProvinceText(data.province)
        if (data.taxNumber) {
        }
      } catch {
        /* ignore */
      }
    }
    const billingMode = (sessionStorage.getItem('radiosBilling') as 'same' | 'different') || 'same'
    setRadiosBilling(billingMode)
    if (billingMode === 'different') {
      try {
        const billing = JSON.parse(sessionStorage.getItem('billing') || '{}')
        form.setFieldsValue({
          firstNameD: billing.firstname || '',
          lastNameD: billing.lastname || '',
          companyD: billing.company || '',
          streetD: Array.isArray(billing.street) ? billing.street[0] : billing.street || '',
          cityD: billing.city || '',
          phoneNumberD: billing.telephone || '',
          countryD: billing.country || '',
          provinceD: billing.region || '',
        })
        if (billing.countryId) setBillingCountryId(billing.countryId)
        if (billing.regionId || billing.region) {
          setBillingProvinceId(billing.regionId)
          setBillingProvinceText(billing.region || '')
        }
      } catch {
        /* ignore */
      }
    }
  }, [cartId, getCartsList, cartsTotals, form, t, navigate])

  useEffect(() => {
    if (country && !trAndItemsQtyMoreThan4) {
      estimateShipping()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country?.id, province?.id])

  useEffect(() => {
    if (!shippingMethodCode) return
    const saved = localStorage.getItem('shipping')
    if (!saved) return
    try {
      const data = JSON.parse(saved)
      if (eoriVat && shippingMethodCode === 'express_delivery') {
        setEoriVatTaxNumber(data.taxNumber || '')
      } else if (data.taxNumber) {
        form.setFieldValue('taxNumber', data.taxNumber)
      }
    } catch {
      /* ignore */
    }
  }, [shippingMethodCode, eoriVat, form])

  useEffect(() => {
    if (!country) return
    const values = form.getFieldsValue(true)
    const names = Object.keys(values).filter((k) => values[k])
    if (names.length) form.validateFields(names).catch(() => {})
  }, [countryId, provinceId, country, form])

  const localeCode = resolveLocaleCode(i18n.language)
  const localeInitRef = useRef(true)
  useEffect(() => {
    if (localeInitRef.current) {
      localeInitRef.current = false
      return
    }
    const values = form.getFieldsValue(true)
    const names = Object.keys(values).filter((k) => values[k])
    if (!names.length) return
    requestAnimationFrame(() => {
      form.validateFields(names).catch(() => {})
    })
  }, [localeCode, form])

  const onCountryChange = (c: CountryItem | null) => {
    setCountry(c)
    setRestoredCountryId(c?.id)
    setProvince(null)
    setRestoredProvinceId(undefined)
    setProvinceText('')
    setVatIdIn('')
    form.setFieldValue('country', c?.full_name_locale || '')
    form.setFieldValue('province', '')
    if (c?.id === 'TW') twPersonalIdTips()
  }

  const onProvinceChange = (p: ProvinceItem | null) => {
    setProvince(p)
    setRestoredProvinceId(p?.id)
    if (p?.name) {
      setProvinceText(p.name)
      form.setFieldValue('province', p.name)
    }
    if (p?.id === '705' || `${p?.id}` === '705') twPersonalIdTips()
  }

  const onFailed = (errorInfo: { errorFields?: { name: (string | number)[] }[] }) => {
    scrollToFirstFormError(errorInfo)
  }

  const buildBillingForm = (values: Record<string, string>): BillingAddressForm | null => {
    if (radiosBilling !== 'different') return null
    return {
      firstName: values.firstNameD,
      lastName: values.lastNameD,
      street: values.streetD,
      countryId: billingCountry?.id || '',
      regionCode: billingProvince?.code || '',
      region: billingProvince?.name || billingProvinceText || values.provinceD || '',
      city: values.cityD,
      company: values.companyD || '',
      phoneNumber: values.phoneNumberD,
      country: billingCountry?.full_name_locale || '',
      provinceId: billingProvince?.id,
    }
  }

  const onSubmit = async (values: Record<string, string>) => {
    if (!cartId) return
    if (!country?.id) {
      showToast(t('checkout.country') || 'Please select country')
      return
    }
    if (country.available_regions?.length && !province?.id) {
      showToast(t('checkout.required_field'))
      return
    }
    if (!country.available_regions?.length && !(province?.name || values.province || provinceText)) {
      showToast(t('checkout.required_field'))
      return
    }
    const billingMode = radiosBilling
    if (billingMode === 'different' && !billingCountry?.id) {
      showToast(t('checkout.country') || 'Please select country')
      return
    }
    if (trAndItemsQtyMoreThan4 || !hasShippingMethods) return

    const method = findShippingMethod(shippingMethods, shippingMethodCode)
    if (!method?.method_code) {
      showToast('Please select a Shipping Method.')
      return
    }

    const vatId = resolveVatId()
    const billing = buildBillingForm(values)
    const param = {
      ...values,
      countryId: country?.id,
      provinceId: province?.id,
      regionCode: province?.code,
      province: province?.name || values.province || provinceText,
      country: country?.full_name_locale,
      taxNumber: vatId || values.taxNumber || '',
      identification: values.identification || '',
    }
    const payload = buildShippingInformationPayload(values, country, province, {
      shippingMethod: method,
      vatId,
      identification: values.identification,
      radiosBilling: billingMode,
      billing,
    })

    showLoading()
    try {
      const couponHeader = getCouponHeader()
      await api.shippingInformation(cartId, payload, couponHeader)
      localStorage.setItem('shipping', JSON.stringify(param))
      sessionStorage.setItem('paramShippingInf', JSON.stringify(payload))
      sessionStorage.setItem('shippingMethodRadio', shippingMethodCode)
      sessionStorage.setItem('radiosBilling', billingMode)
      sessionStorage.removeItem('entityId')
      if (billingMode === 'different' && billing) {
        sessionStorage.setItem(
          'billing',
          JSON.stringify({
            ...payload.addressInformation.billing_address,
            country: billing.country,
          }),
        )
      }
      await cartsTotals()
      navigate('/order/summary')
    } catch (error: any) {
      showToast(error?.msg || error?.message || 'Submit failed')
    } finally {
      hideLoading()
    }
  }

  const zipCodeBlur = () => {
    if (countryId === 'IN' && zipCodeHasChange) {
      estimateShipping()
      setZipCodeHasChange(false)
    }
  }

  const labelRequired = (text: string, showStar = true) => (
    <span>
      {text}
      {showStar ? <span style={{ color: 'red' }}>*</span> : null}
    </span>
  )

  const renderShippingNameFields = () => {
    const firstNameField = (
      <div className="form-items">
        <div className="label">
          {labelRequired(t('checkout.first_name'))}
          {isTw ? (
            <span style={{ color: '#71708A' }}> ({t('checkout.fill_in_chinese')})</span>
          ) : null}
        </div>
        <Form.Item
          name="firstName"
          getValueFromEvent={(v) => formatter(String(v ?? ''))}
          rules={[
            { required: true, message: t('checkout.required_field') },
            {
              validator: async (_, val) => {
                if (val && val.length > 20) {
                  throw new Error(t('checkout.less_or_equal_than_15_symbols'))
                }
                if (needCnNameValidation && val && !isChineseName(val)) {
                  throw new Error(t('checkout.name_n_f_chinese'))
                }
              },
            },
          ]}
        >
          <Input />
        </Form.Item>
      </div>
    )
    const lastNameField = (
      <div className="form-items">
        <div className="label">
          {labelRequired(t('checkout.last_name'))}
          {isTw ? (
            <span style={{ color: '#71708A' }}> ({t('checkout.fill_in_chinese')})</span>
          ) : null}
        </div>
        <Form.Item
          name="lastName"
          getValueFromEvent={(v) => formatter(String(v ?? ''))}
          rules={[
            { required: true, message: t('checkout.required_field') },
            {
              validator: async (_, val) => {
                if (val && val.length > 20) {
                  throw new Error(t('checkout.less_or_equal_than_15_symbols'))
                }
                if (needCnNameValidation && val && !isChineseName(val)) {
                  throw new Error(t('checkout.name_n_f_chinese'))
                }
              },
            },
          ]}
        >
          <Input />
        </Form.Item>
      </div>
    )

    return (
      <div className="side-by-side">
        {isChineseLocale ? (
          <>
            {lastNameField}
            {firstNameField}
          </>
        ) : (
          <>
            {firstNameField}
            {lastNameField}
          </>
        )}
      </div>
    )
  }

  const renderBillingNameFields = () => {
    const firstNameField = (
      <div className="form-items">
        <div className="label">{labelRequired(t('checkout.first_name'))}</div>
        <Form.Item
          name="firstNameD"
          getValueFromEvent={(v) => formatter(String(v ?? ''))}
          rules={[
            { required: true, message: t('checkout.required_field') },
            {
              validator: async (_, val) => {
                if (val && val.length > 20) {
                  throw new Error(t('checkout.less_or_equal_than_15_symbols'))
                }
              },
            },
          ]}
        >
          <Input />
        </Form.Item>
      </div>
    )
    const lastNameField = (
      <div className="form-items">
        <div className="label">{labelRequired(t('checkout.last_name'))}</div>
        <Form.Item
          name="lastNameD"
          getValueFromEvent={(v) => formatter(String(v ?? ''))}
          rules={[
            { required: true, message: t('checkout.required_field') },
            {
              validator: async (_, val) => {
                if (val && val.length > 20) {
                  throw new Error(t('checkout.less_or_equal_than_15_symbols'))
                }
              },
            },
          ]}
        >
          <Input />
        </Form.Item>
      </div>
    )

    return (
      <div className="side-by-side">
        {isChineseLocale ? (
          <>
            {lastNameField}
            {firstNameField}
          </>
        ) : (
          <>
            {firstNameField}
            {lastNameField}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="shippingAddress-container page-container">
      <div className="shopping-list">
        <div className="title">
          {t('checkout.shopping_list')}:
        </div>
        <div className="list">
          <div className="list-img" onClick={() => setListShow(true)}>
            {cartsImgList.map((src, i) => (
              <div key={`${src}_${i}`} className="img-items">
                <img src={src} alt="" />
              </div>
            ))}
          </div>
        </div>
        <div className="total">
          <div className="total-items">
            {cartsTotal?.items_qty} {t('checkout.Items')}
          </div>
          <div className="total-price">
            {renderShoppingListPrice()}
          </div>
        </div>
      </div>

      <div className="shopping-address">
        <h3 className="title title-with-hint">
          {t('checkout.shipping_address')}
          <HintIcon content={t('checkout.data_retention_tips')} />
        </h3>
        <Divider className="address-divider" style={{borderColor: '#ebedf0'}} />
        <div className="address-form">
          <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            onFinishFailed={onFailed}
            footer={
              !trAndItemsQtyMoreThan4 && hasShippingMethods ? (
                <div className="btn-submit">
                  <Button block type="submit" color="primary" className="next-btn">
                    {t('checkout.next')}
                  </Button>
                </div>
              ) : null
            }
          >
            {/* Email */}
            <div className="form-items">
              <div className="label label-with-hint">
                {labelRequired(t('checkout.email_address'))}
                <HintIcon content={t('checkout.email_alias_tips')} />
              </div>
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: t('checkout.required_field') },
                  {
                    validator: async (_, val) => {
                      if (val && !EMAIL_PATTERN.test(val)) {
                        throw new Error(t('checkout.valid_email_address'))
                      }
                    },
                  },
                ]}
              >
                <Input type="email" placeholder="example@domain.com" />
              </Form.Item>
              <p className="tips">{t('checkout.please_make_sure_that_the_email')}</p>
            </div>

            {/* First / Last name */}
            {renderShippingNameFields()}

            {/* Company */}
            <div className="form-items">
              <div className="label">{t('checkout.company')}</div>
              <Form.Item
                name="company"
                getValueFromEvent={(v) => formatter(String(v ?? ''))}
                rules={[
                  {
                    validator: async (_, val) => {
                      if (val && val.length > 70) {
                        throw new Error(t('checkout.less_or_equal_than_70_symbols'))
                      }
                    },
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </div>

            {/* Country / Province */}
            <CountryProvinceSelect
              layout="side-by-side"
              countryId={restoredCountryId}
              provinceId={restoredProvinceId}
              provinceText={provinceText}
              onProvinceTextChange={(text) => {
                setProvinceText(text)
                form.setFieldValue('province', text)
              }}
              onCountryChange={onCountryChange}
              onProvinceChange={onProvinceChange}
              renderCountryField={(picker) => (
                <Form.Item
                  name="country"
                  rules={[{ required: true, message: t('checkout.required_field') }]}
                >
                  {picker}
                </Form.Item>
              )}
              renderProvinceField={(field, hasList) =>
                hasList ? (
                  <Form.Item
                    name="province"
                    rules={[{ required: true, message: t('checkout.required_field') }]}
                  >
                    {field}
                  </Form.Item>
                ) : (
                  <Form.Item
                    name="province"
                    getValueFromEvent={(v) => {
                      const next = formatter(String(v ?? ''))
                      setProvinceText(next)
                      setProvince(next ? { id: '', code: '', name: next } : null)
                      return next
                    }}
                    rules={[
                      { required: true, message: t('checkout.required_field') },
                      {
                        validator: async (_, val) => {
                          if (needCnValidation && val && !hasChineseChars(val)) {
                            throw new Error(t('checkout.province_n_f_chinese'))
                          }
                        },
                      },
                    ]}
                  >
                    <Input placeholder={t('checkout.state_province')} />
                  </Form.Item>
                )
              }
            />

            {/* City */}
            <div className="form-items">
              <div className="label">
                {labelRequired(t('checkout.city'))}
                {showCnHint ? (
                  <span style={{ color: '#71708A' }}> ({t('checkout.fill_in_chinese')})</span>
                ) : null}
              </div>
              <Form.Item
                name="city"
                getValueFromEvent={(v) => formatter(String(v ?? ''))}
                rules={[
                  { required: true, message: t('checkout.required_field') },
                  {
                    validator: async (_, val) => {
                      if (val && val.length > 70) {
                        throw new Error(t('checkout.less_or_equal_than_70_symbols'))
                      }
                      if (needCnValidation && val && !hasChineseChars(val)) {
                        throw new Error(t('checkout.city_n_f_chinese'))
                      }
                    },
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </div>

            {/* Postal code */}
            <div className="form-items">
              <div className="label">
                {labelRequired(t('checkout.zip_postal_code'), !postalOptional)}
              </div>
              <Form.Item
                name="postalCode"
                getValueFromEvent={(v) => {
                  const next = formatter(String(v ?? ''))
                  setZipCodeHasChange(true)
                  return next
                }}
                rules={[
                  {
                    required: !postalOptional,
                    message: t('checkout.required_field'),
                  },
                  {
                    validator: async (_, val) => {
                      if (val && !isValidPostalCode(val)) {
                        throw new Error(t('checkout.invalid_format_example'))
                      }
                    },
                  },
                ]}
              >
                <Input className="ltr-field" onBlur={zipCodeBlur} />
              </Form.Item>
            </div>

            {/* Street */}
            <div className="form-items">
              <div className="label label-with-hint">
                {labelRequired(t('checkout.street_address'))}
                {showCnHint ? (
                  <span style={{ color: '#71708A' }}> ({t('checkout.fill_in_chinese')})</span>
                ) : null}
                {showPoBoxHint ? <HintIcon content={t('checkout.po_box_tips')} /> : null}
              </div>
              <Form.Item
                name="street"
                getValueFromEvent={(v) => formatter(String(v ?? ''))}
                rules={[
                  { required: true, message: t('checkout.required_field') },
                  {
                    validator: async (_, val) => {
                      if (val && val.length > 70) {
                        throw new Error(t('checkout.less_or_equal_than_70_symbols'))
                      }
                      if (needCnValidation && val && !hasMinChineseChars(val, 5)) {
                        throw new Error(t('checkout.address_n_f_chinese'))
                      }
                    },
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <p className="tips">{t('checkout.include_unit_number')}</p>
            </div>

            {/* Phone */}
            <div className="form-items">
              <div className="label">{labelRequired(t('checkout.phone_number'))}</div>
              <Form.Item
                name="phoneNumber"
                rules={[
                  { required: true, message: t('checkout.required_field') },
                  {
                    validator: async (_, val) => {
                      if (!val) return
                      const ok =
                        countryId === 'CN' && provinceId !== '705'
                          ? isValidCnPhone(val)
                          : isValidIntlPhone(val)
                      if (!ok) throw new Error(t('checkout.valid_phone_number'))
                    },
                  },
                ]}
              >
                <Input type="tel" />
              </Form.Item>
              <p className="tips">{t('checkout.kindly_ensure_this_phone_number')}</p>
            </div>

            {/* PID */}
            {isShowPID ? (
              <div className="form-items">
                <div className="label">
                  {labelRequired(t('checkout.personal_identification_no'))}
                </div>
                <Form.Item
                  name="identification"
                  rules={[
                    { required: true, message: t('checkout.required_field') },
                    {
                      validator: async (_, val) => {
                        if (!val) return
                        if (!isTw && !isZA) {
                          if (val.length < 11) {
                            throw new Error('Please enter more or equal than 11 symbols.')
                          }
                          if (val.length > 11) {
                            throw new Error('Please enter less or equal than 11 symbols.')
                          }
                        }
                        const ok = isTw
                          ? isValidTwPid(val)
                          : isZA
                            ? isValidZaPid(val)
                            : isValidTrPid(val)
                        if (!ok) throw new Error(t('checkout.valid_number_in_this_field'))
                      },
                    },
                  ]}
                >
                  <Input className="ltr-field" />
                </Form.Item>
                <p className="tips">
                  {isTw
                    ? t('checkout.this_number_is_required')
                    : t('checkout.this_number_is_required_tk')}
                </p>
              </div>
            ) : null}

            {/* Tax BR/CL */}
            {isShowTax ? (
              <div className="form-items">
                <div className="label">{labelRequired(t('checkout.tax_number'))}</div>
                <Form.Item
                  name="taxNumber"
                  rules={[
                    { required: true, message: t('checkout.required_field') },
                    {
                      validator: async (_, val) => {
                        if (!val) return
                        const ok = isBR ? isValidBrTax(val) : isValidClTax(val)
                        if (!ok) throw new Error(t('checkout.invalid_format'))
                      },
                    },
                  ]}
                >
                  <Input
                    className="ltr-field"
                    placeholder={
                      isBR ? 'xxx.xxx.xxx-xx ou xx.xxx.xxx/xxxx-xx' : 'xx.xxx.xxx-x'
                    }
                  />
                </Form.Item>
              </div>
            ) : null}

            <div className="billing-information">
              <div className="title-box">
                <h3 className="title">{t('checkout.billing_information')}</h3>
                <div className="title-tips">
                  <p>{t('checkout.select_the_address_that_matches')}</p>
                </div>
                <Divider className="address-divider" />
              </div>
              <div className="content-box">
                <div className="radio-group">
                  <Radio.Group
                    value={radiosBilling}
                    onChange={(v) => setRadiosBilling(v as 'same' | 'different')}
                  >
                    <Radio value="same" style={{ '--icon-size': '18px', '--font-size': '14px' }}>
                      {t('checkout.same_as_shipping_address')}
                    </Radio>
                    <Divider className="radio-divider" />
                    <Radio
                      value="different"
                      style={{ '--icon-size': '18px', '--font-size': '14px' }}
                    >
                      {t('checkout.use_different_billing_address')}
                    </Radio>
                  </Radio.Group>
                  <div
                    className={`different-box${radiosBilling !== 'same' ? ' open' : ''}`}
                  >
                    {radiosBilling !== 'same' ? (
                      <>
                        {renderBillingNameFields()}
                        <div className="form-items">
                          <div className="label">{t('checkout.company')}</div>
                          <Form.Item
                            name="companyD"
                            getValueFromEvent={(v) => formatter(String(v ?? ''))}
                          >
                            <Input />
                          </Form.Item>
                        </div>
                        <div className="form-items">
                          <div className="label">
                            {labelRequired(t('checkout.street_address'))}
                          </div>
                          <Form.Item
                            name="streetD"
                            getValueFromEvent={(v) => formatter(String(v ?? ''))}
                            rules={[
                              { required: true, message: t('checkout.required_field') },
                              {
                                validator: async (_, val) => {
                                  if (val && val.length > 70) {
                                    throw new Error(t('checkout.less_or_equal_than_70_symbols'))
                                  }
                                },
                              },
                            ]}
                          >
                            <Input />
                          </Form.Item>
                          <p className="tips">{t('checkout.include_unit_number')}</p>
                        </div>
                        <CountryProvinceSelect
                          layout="side-by-side"
                          useTypeB
                          countryId={billingCountryId}
                          provinceId={billingProvinceId}
                          provinceText={billingProvinceText}
                          onProvinceTextChange={(text) => {
                            setBillingProvinceText(text)
                            form.setFieldValue('provinceD', text)
                          }}
                          onCountryChange={(c) => {
                            setBillingCountry(c)
                            setBillingCountryId(c?.id)
                            setBillingProvince(null)
                            setBillingProvinceId(undefined)
                            setBillingProvinceText('')
                            form.setFieldValue('countryD', c?.full_name_locale || '')
                            form.setFieldValue('provinceD', '')
                          }}
                          onProvinceChange={(p) => {
                            setBillingProvince(p)
                            setBillingProvinceId(p?.id)
                            if (p?.name) {
                              setBillingProvinceText(p.name)
                              form.setFieldValue('provinceD', p.name)
                            }
                          }}
                          renderCountryField={(picker) => (
                            <Form.Item
                              name="countryD"
                              rules={[{ required: true, message: t('checkout.required_field') }]}
                            >
                              {picker}
                            </Form.Item>
                          )}
                          renderProvinceField={(field, hasList) =>
                            hasList ? (
                              <Form.Item
                                name="provinceD"
                                rules={[{ required: true, message: t('checkout.required_field') }]}
                              >
                                {field}
                              </Form.Item>
                            ) : (
                              <Form.Item
                                name="provinceD"
                                getValueFromEvent={(v) => {
                                  const next = formatter(String(v ?? ''))
                                  setBillingProvinceText(next)
                                  setBillingProvince(
                                    next ? { id: '', code: '', name: next } : null,
                                  )
                                  return next
                                }}
                                rules={[
                                  { required: true, message: t('checkout.required_field') },
                                ]}
                              >
                                <Input placeholder={t('checkout.state_province')} />
                              </Form.Item>
                            )
                          }
                        />
                        <div className="form-items">
                          <div className="label">{labelRequired(t('checkout.city'))}</div>
                          <Form.Item
                            name="cityD"
                            getValueFromEvent={(v) => formatter(String(v ?? ''))}
                            rules={[{ required: true, message: t('checkout.required_field') }]}
                          >
                            <Input />
                          </Form.Item>
                        </div>
                        <div className="form-items">
                          <div className="label">{labelRequired(t('checkout.phone_number'))}</div>
                          <Form.Item
                            name="phoneNumberD"
                            rules={[
                              { required: true, message: t('checkout.required_field') },
                              {
                                validator: async (_, val) => {
                                  if (val && !isValidIntlPhone(val)) {
                                    throw new Error(t('checkout.valid_phone_number'))
                                  }
                                },
                              },
                            ]}
                          >
                            <Input type="tel" />
                          </Form.Item>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Methods */}
            {trAndItemsQtyMoreThan4 ? (
              <div className="shipping-methods">
                <div className="title-box">
                  <h3 className="title">{t('checkout.shipping_methods')}</h3>
                  <Divider className="address-divider" />
                </div>
                <div className="tk-morethan4">
                  <p>{t('checkout.tk_order_contains_tips')}</p>
                </div>
              </div>
            ) : (
              <LogisticsTips
                methods={shippingMethods}
                value={shippingMethodCode}
                onChange={setShippingMethodCode}
              />
            )}

            {/* Express tax / PAN */}
            {!trAndItemsQtyMoreThan4 && shippingMethodCode === 'express_delivery' ? (
              <div className="form-items">
                {eoriVat ? (
                  <>
                    <div className="label">{t('checkout.tax_number')}</div>
                    <Input
                      className="ltr-field"
                      value={eoriVatTaxNumber}
                      onChange={setEoriVatTaxNumber}
                      placeholder=""
                    />
                    <p className="tips">{t('checkout.provide_the_tax_number')}</p>
                  </>
                ) : (
                  <>
                    <div className="label">
                      {countryId === 'ID' ? 'Personal ID' : 'PAN'}
                      <span style={{ color: 'red' }}>*</span>
                    </div>
                    <Form.Item
                      name="identificationInId"
                      rules={[{ required: true, message: t('checkout.required_field') }]}
                      getValueFromEvent={(v) => {
                        const next = String(v ?? '')
                        setVatIdIn(next)
                        return next
                      }}
                    >
                      <Input className="ltr-field" />
                    </Form.Item>
                    <p className="tips">{t('checkout.provide_the_tax_number')}</p>
                  </>
                )}
              </div>
            ) : null}
          </Form>
        </div>
      </div>

      <Popup
        visible={listShow}
        onMaskClick={() => setListShow(false)}
        onClose={() => setListShow(false)}
        position="right"
        bodyStyle={{ height: '100%', width: 'calc(var(--h5-col, 100vw) * 0.8)' }}
        showCloseButton
      >
        <div className="list-popup">
          <div className="title">
            <h3>{t('checkout.shopping_list')}</h3>
          </div>
          <div className="list-box">
            {showList.map((item, index) => (
              <div className="list-item" key={item.item_id ?? index}>
                <div className="list-item-box">
                  <div className="item-image">
                    <img
                      src={`https://static.isafepal.com/mshop/dev/${item.sku}.png`}
                      alt=""
                    />
                  </div>
                  <div className="item-content">
                    <div className="title-item">
                      <h3>{item.name}</h3>
                    </div>
                    <div className="qty">
                      {t('common.QTY')}: {item.qty}
                    </div>
                    <div className="price">${item.price}</div>
                  </div>
                </div>
                {index !== carts.length - 1 ? (
                  <Divider style={{ borderColor: '#CAC9D8', margin: 0 }} />
                ) : null}
              </div>
            ))}
          </div>
          <Divider style={{ borderColor: '#E1E0EC', margin: 0, padding: '0 16px' }} />
          <div className="list-total">
            <div className="items">
              {cartsTotal?.items_qty} {t('checkout.Items')}
            </div>
            <div className="total">
              <span className="total-text">{t('checkout.total')} </span>
              <span className="price-text">
                {renderShoppingListPrice()}
              </span>
            </div>
          </div>
        </div>
      </Popup>
    </div>
  )
}
