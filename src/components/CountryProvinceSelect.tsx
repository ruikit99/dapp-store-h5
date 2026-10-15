import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Input, Popup } from 'antd-mobile'
import { CloseOutline, CheckCircleFill, SearchOutline, UpOutline, DownOutline } from 'antd-mobile-icons'
import { api } from '@/api'
import { formatter } from '@/lib/formUtils'
import './CountryProvinceSelect.less'

export type CountryItem = {
  id: string
  full_name_locale: string
  full_name_english?: string
  img?: string
  keyword?: string[]
  available_regions?: ProvinceItem[]
}

export type ProvinceItem = {
  id: string
  code: string
  name: string
  keyword?: string[]
}

export type BillingAddressForm = {
  firstName: string
  lastName: string
  street: string
  countryId: string
  regionCode: string
  region: string
  city: string
  company: string
  phoneNumber: string
  country: string
  provinceId?: string
}

type Props = {
  countryId?: string
  provinceId?: string
  onCountryChange: (country: CountryItem | null) => void
  onProvinceChange: (province: ProvinceItem | null) => void
  useTypeB?: boolean
  layout?: 'stack' | 'side-by-side'
  provinceText?: string
  onProvinceTextChange?: (text: string) => void
  required?: boolean
  excludeCountryIds?: string[]
  renderCountryField?: (picker: ReactNode) => ReactNode
  renderProvinceField?: (field: ReactNode, hasProvinceList: boolean) => ReactNode
}

const COUNTRY_KEYWORDS: Record<string, string[]> = {
  CN: ['china', 'mainland', 'mainland china', '中国', '中國', '中', 'zg', 'zhong guo', 'zhongguo'],
  HK: [
    'china',
    '中国',
    '中國',
    '中',
    'zg',
    'zhong guo',
    'zhongguo',
    '香',
    '香港',
    '港',
    'hong kong',
    'hongkong',
    'hk',
    'xiang',
    'xianggang',
    'xiang gang',
  ],
  TW: [
    'china',
    '中国',
    '中國',
    '中',
    'zg',
    'zhong guo',
    'zhongguo',
    '台',
    '台湾',
    '湾',
    '灣',
    '台灣',
    'taiwan',
    'tai',
  ],
  MO: [
    'china',
    '中国',
    '中國',
    '中',
    'zg',
    'zhong guo',
    'zhongguo',
    '澳',
    '澳门',
    '门',
    '澳門',
    '門',
    'macau',
    'ao men',
    'aomen',
  ],
}

const REGION_KEYWORDS: Record<string, string[]> = {
  '689': ['香', '香港', '港', 'hong kong', 'hongkong', 'hk', 'xiang', 'xianggang', 'xiang gang'],
  '696': ['澳', '澳门', '门', '澳門', '門', 'macau', 'ao men', 'aomen'],
  '705': ['台', '台湾', '湾', '灣', '台灣', 'taiwan', 'tai'],
}

function enrichCountries(list: CountryItem[]): CountryItem[] {
  return list.map((item) => {
    const next = { ...item }
    if (COUNTRY_KEYWORDS[item.id]) {
      next.keyword = COUNTRY_KEYWORDS[item.id]
    }
    if (item.id === 'CN' && item.available_regions) {
      next.available_regions = item.available_regions.map((r) => {
        const kw = REGION_KEYWORDS[`${r.id}`]
        return kw ? { ...r, keyword: kw } : r
      })
    }
    return next
  })
}

function filterList<T extends Record<string, any>>(
  list: T[],
  search: string,
  searchKeys: string[],
  valueKey: string,
): T[] {
  const str = search.replace(/\s*/g, '')
  if (!str) return list
  return list.filter((item) => {
    return searchKeys.some((key) => {
      if (key !== 'keyword') {
        const val = item[key]
        return val ? String(val).toLowerCase().indexOf(str.toLowerCase()) !== -1 : false
      }
      if (key === 'keyword' && Array.isArray(item.keyword)) {
        return item.keyword.some((p: string) =>
          p ? p.toLowerCase().indexOf(str.toLowerCase()) !== -1 : false,
        )
      }
      return false
    })
  })
}

type SelectPopupProps = {
  visible: boolean
  onClose: () => void
  list: any[]
  selectedId?: string
  valueKey: string
  searchKeys: string[]
  onConfirm: (item: any) => void
}

function SelectPopup({
  visible,
  onClose,
  list,
  selectedId,
  valueKey,
  searchKeys,
  onConfirm,
}: SelectPopupProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (visible) setSearch('')
  }, [visible])

  const filtered = useMemo(
    () => filterList(list, search, searchKeys, valueKey),
    [list, search, searchKeys, valueKey],
  )

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      onClose={onClose}
      position="bottom"
      bodyStyle={{ height: '70%', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
    >
      <div className="country-province-select">
        <div className="select-content">
          <div className="top-title">
            <span />
            <button type="button" className="close-btn" onClick={onClose} aria-label="close">
              <CloseOutline fontSize={20} />
            </button>
          </div>
          {list.length >= 5 && (
            <div className="search-box">
              <SearchOutline className="search-icon" fontSize={16} color="#999" />
              <Input
                clearable
                value={search}
                onChange={setSearch}
                placeholder={t('common.search_by_name') || 'Search by name'}
              />
            </div>
          )}
          <div className="select-box">
            {filtered.map((item, index) => {
              const selected = `${selectedId}` === `${item.id}`
              return (
                <div
                  key={`${item.id}_${index}`}
                  className="select-item"
                  onClick={() => onConfirm(item)}
                >
                  <div className="item-content">
                    {item.img ? (
                      <div className="flag-img">
                        <img src={item.img} alt="" />
                      </div>
                    ) : null}
                    <div className={`title${selected ? ' selected' : ''}`}>
                      {item[valueKey] || item.id}
                    </div>
                    <div className="item-select">
                      {selected ? <CheckCircleFill color="#4A21EF" fontSize={24} /> : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Popup>
  )
}

export default function CountryProvinceSelect({
  countryId,
  provinceId,
  onCountryChange,
  onProvinceChange,
  useTypeB,
  layout = 'stack',
  provinceText,
  onProvinceTextChange,
  required = true,
  excludeCountryIds,
  renderCountryField,
  renderProvinceField,
}: Props) {
  const { t } = useTranslation()
  const [countries, setCountries] = useState<CountryItem[]>([])
  const [countryVisible, setCountryVisible] = useState(false)
  const [provinceVisible, setProvinceVisible] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<CountryItem | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<ProvinceItem | null>(null)
  const userInteractedRef = useRef(false)
  const restoredRef = useRef(false)

  const excludeKey = (excludeCountryIds || []).join(',')

  useEffect(() => {
    const load = async () => {
      const res: any = useTypeB ? await api.getCountriesB() : await api.getCountries()
      const list = (res || []) as CountryItem[]
      const filtered = excludeCountryIds?.length
        ? list.filter((item) => !excludeCountryIds.includes(item.id))
        : list
      setCountries(enrichCountries(filtered))
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useTypeB, excludeKey])

  useEffect(() => {
    if (userInteractedRef.current || restoredRef.current || !countries.length) return
    restoredRef.current = true
    if (!countryId) return
    const found = countries.find((c) => c.id === countryId)
    if (!found) return

    setSelectedCountry(found)
    onCountryChange(found)

    if (provinceId && found.available_regions?.length) {
      const prov = found.available_regions.find((p) => `${p.id}` === `${provinceId}`)
      if (prov) {
        setSelectedProvince(prov)
        onProvinceChange(prov)
      }
    } else if (!found.available_regions?.length && provinceText) {
      const p = { id: '', code: '', name: provinceText }
      setSelectedProvince(p)
      onProvinceChange(p)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryId, countries])

  const provinces = selectedCountry?.available_regions || []
  const hasProvinceList = provinces.length > 0

  const handleCountryConfirm = useCallback(
    (country: CountryItem) => {
      userInteractedRef.current = true
      setSelectedCountry(country)
      setSelectedProvince(null)
      onCountryChange(country)
      onProvinceChange(null)
      onProvinceTextChange?.('')
      setCountryVisible(false)
    },
    [onCountryChange, onProvinceChange, onProvinceTextChange],
  )

  const handleProvinceConfirm = useCallback(
    (province: ProvinceItem) => {
      userInteractedRef.current = true
      setSelectedProvince(province)
      onProvinceChange(province)
      onProvinceTextChange?.(province.name)
      setProvinceVisible(false)
    },
    [onProvinceChange, onProvinceTextChange],
  )

  const countryPicker = (
    <button type="button" className="picker-field" onClick={() => setCountryVisible(true)}>
      <span className={`picker-text${selectedCountry ? '' : ' placeholder'}`}>
        {selectedCountry?.full_name_locale || t('common.select')}
      </span>
      <span className="arrow">{countryVisible ? <UpOutline fontSize={16} /> : <DownOutline fontSize={16} />}</span>
    </button>
  )

  const provincePicker = hasProvinceList ? (
    <button type="button" className="picker-field" onClick={() => setProvinceVisible(true)}>
      <span className={`picker-text${selectedProvince?.name ? '' : ' placeholder'}`}>
        {selectedProvince?.name || t('common.select')}
      </span>
      <span className="arrow">{provinceVisible ? <UpOutline fontSize={16} /> : <DownOutline fontSize={16} />}</span>
    </button>
  ) : (
    <input
      className="text-field"
      value={provinceText ?? selectedProvince?.name ?? ''}
      onChange={(e) => {
        userInteractedRef.current = true
        const name = formatter(e.target.value)
        const p = { id: '', code: '', name }
        setSelectedProvince(p)
        onProvinceChange(p)
        onProvinceTextChange?.(name)
      }}
      placeholder={t('checkout.state_province')}
    />
  )

  const countryField = (
    <div className="form-items">
      <div className="label">
        {t('checkout.country')}
        {required ? <span className="required">*</span> : null}
      </div>
      {renderCountryField ? renderCountryField(countryPicker) : countryPicker}
    </div>
  )

  const provinceField = (
    <div className="form-items">
      <div className="label">
        {t('checkout.state_province')}
        {required ? <span className="required">*</span> : null}
      </div>
      {renderProvinceField
        ? renderProvinceField(provincePicker, hasProvinceList)
        : provincePicker}
    </div>
  )

  return (
    <>
      <div className={layout === 'side-by-side' ? 'side-by-side country-province-row' : undefined}>
        {countryField}
        {provinceField}
      </div>

      <SelectPopup
        visible={countryVisible}
        onClose={() => setCountryVisible(false)}
        list={countries}
        selectedId={selectedCountry?.id}
        valueKey="full_name_locale"
        searchKeys={
          useTypeB
            ? ['full_name_english', 'full_name_locale']
            : ['full_name_english', 'full_name_locale', 'keyword']
        }
        onConfirm={handleCountryConfirm}
      />
      <SelectPopup
        visible={provinceVisible}
        onClose={() => setProvinceVisible(false)}
        list={provinces}
        selectedId={selectedProvince?.id}
        valueKey="name"
        searchKeys={useTypeB ? ['name'] : ['name', 'keyword']}
        onConfirm={handleProvinceConfirm}
      />
    </>
  )
}

export type EstimateExtra = {
  vatId?: string
  identification?: string
}

export function buildEstimateAddressPayload(
  form: Record<string, string>,
  country: CountryItem | null,
  province: ProvinceItem | null,
  extra?: EstimateExtra,
) {
  return {
    address: {
      street: [form.street],
      city: form.city,
      region: province?.name || form.province,
      country_id: country?.id || 'US',
      postcode: form.postalCode || '',
      firstname: form.firstName,
      lastname: form.lastName,
      company: form.company || '',
      telephone: form.phoneNumber,
      vat_id: extra?.vatId || '',
      custom_attributes: [
        {
          attribute_code: 'id_number',
          value: extra?.identification || form.identification || '',
        },
      ],
      ...(province?.id ? { region_id: province.id } : {}),
    },
  }
}

export type ShippingPayloadOptions = {
  shippingMethod: { method_code?: string; carrier_code?: string }
  vatId?: string
  identification?: string
  radiosBilling?: 'same' | 'different'
  billing?: BillingAddressForm | null
}

export function buildShippingInformationPayload(
  form: Record<string, string>,
  country: CountryItem | null,
  province: ProvinceItem | null,
  options: ShippingPayloadOptions | { method_code?: string; carrier_code?: string },
) {
  const opts: ShippingPayloadOptions =
    'shippingMethod' in options
      ? options
      : { shippingMethod: options as { method_code?: string; carrier_code?: string } }

  const regionCode = province?.code || ''
  const region = province?.name || form.province
  const identification = opts.identification || form.identification || ''
  const vatId = opts.vatId || ''
  const different = opts.radiosBilling === 'different' && opts.billing

  const shippingAddress: Record<string, any> = {
    countryId: country?.id,
    regionCode,
    region,
    street: [form.street],
    company: form.company || '',
    telephone: form.phoneNumber,
    postcode: form.postalCode,
    city: form.city,
    firstname: form.firstName,
    lastname: form.lastName,
    vatId,
    customAttributes: [{ attribute_code: 'id_number', value: identification }],
    extension_attributes: { id_number: identification },
  }

  const billingAddress: Record<string, any> = different
    ? {
        countryId: opts.billing!.countryId,
        regionCode: opts.billing!.regionCode,
        region: opts.billing!.region,
        street: [opts.billing!.street],
        company: opts.billing!.company || '',
        telephone: opts.billing!.phoneNumber,
        postcode: form.postalCode,
        city: opts.billing!.city,
        firstname: opts.billing!.firstName,
        lastname: opts.billing!.lastName,
        vat_id: vatId,
        customAttributes: [{ attribute_code: 'id_number', value: identification }],
      }
    : {
        countryId: country?.id,
        regionCode,
        region,
        street: [form.street],
        company: form.company || '',
        telephone: form.phoneNumber,
        postcode: form.postalCode,
        city: form.city,
        firstname: form.firstName,
        lastname: form.lastName,
        vat_id: vatId,
        customAttributes: [{ attribute_code: 'id_number', value: identification }],
      }

  if (province?.id) {
    shippingAddress.regionId = province.id
    if (!different) billingAddress.regionId = province.id
  }
  if (different && opts.billing?.provinceId) {
    billingAddress.regionId = opts.billing.provinceId
  }

  return {
    addressInformation: {
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      shipping_method_code: opts.shippingMethod.method_code,
      shipping_carrier_code: opts.shippingMethod.carrier_code,
    },
  }
}
