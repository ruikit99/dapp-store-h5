import { http } from './http'

function getFormData(data: Record<string, any>) {
  const formData = new FormData()
  for (const key in data) {
    formData.append(key, data[key])
  }
  return formData
}

export const api = {
  getProducts: (page?: number) =>
    http.get(
      `/products?searchCriteria[filter_groups][0][filters][0][field]=category_id&searchCriteria[filter_groups][0][filters][0][value]=2`,
    ),
  getRecommend: (params?: any) => http.get(`/getGroupProductList`, { params }),
  getAllGroupProductListForNewPage: (params?: any) => http.get(`/getAllGroupProductListForNewPage`, { params }),
  getProductDetail: (sku: string) => http.get(`/products/${sku}`),
  getCartId: (data?: any) => http.post('/guest-carts', data),
  addItemToCart: (data: any, cartId: string) =>
    http.post(`/guest-carts/${cartId}/items`, data, { ignoreErrorPage: true } as any),
  getCartList: (cartId: string) => http.get(`/guest-carts/${cartId}/items`),
  getCartsTotals: (cartId: string) => http.get(`/guest-carts/${cartId}/totals`),
  getZhe: (cartId: string) => http.get(`/getZhe/${cartId}`),
  changeCartItem: (cartId: string, itemId: string | number, data: any) =>
    http.put(`/guest-carts/${cartId}/items/${itemId}`, data, { ignoreErrorPage: true } as any),
  deleteCartItem: (cartId: string, itemId: string | number) =>
    http.delete(`/guest-carts/${cartId}/items/${itemId}`, { ignoreErrorPage: true } as any),
  getCountries: () => http.get('/getCountries'),
  getCountriesB: () => http.get('/getCountries?type=1'),
  getCountryById: (id: string) => http.get(`/directory/countries/${id}`),
  estimateShippingMethods: (cartId: string, data: any, coupons?: string) =>
    http.post(`/guest-carts/${cartId}/estimate-shipping-methods`, data, {
      ignoreErrorPage: true,
      headers: { COUPON: coupons || '' },
    } as any),
  payOrder: (cartId: string, data: any) => http.post(`guest-carts/${cartId}/order`, data),
  useCoupons: (cartId: string, coupons: string) =>
    http.put(`/guest-carts/${cartId}/coupons/${coupons}`, {}, { ignoreErrorPage: true } as any),
  deleteCoupons: (cartId: string) =>
    http.delete(`/guest-carts/${cartId}/coupons`, { ignoreErrorPage: true } as any),
  shippingInformation: (cartId: string, data: any, coupons?: string) =>
    http.post(`/guest-carts/${cartId}/shipping-information`, data, {
      ignoreErrorPage: true,
      headers: { COUPON: coupons || '' },
    } as any),
  setPaymentInformation: (cartId: string, data: any) =>
    http.post(`/guest-carts/${cartId}/set-payment-information`, data, { ignoreErrorPage: true } as any),
  getShippingMethods: (cartId: string) => http.get(`/guest-carts/${cartId}/shipping-methods`),
  paymentInformation: (cartId: string, data: any) =>
    http.post(`/guest-carts/${cartId}/payment-information`, data, { ignoreErrorPage: true } as any),
  getMchCoinList: (data: any) => http.post('/getMchCoinList', data, { ignoreErrorPage: true } as any),
  walletPayNewOrder: (data: any) => http.post('/walletPayNewOrder', data, { ignoreErrorPage: true } as any),
  updateConnectedOrder: (data: any) =>
    http.post('/updateOrderTxHash', data, { ignoreErrorPage: true } as any),
  getOrderDetails: (data: any) =>
    http.post(`/getOrderDetails`, getFormData(data), {
      contentType: 'multipart/form-data',
      ignoreErrorPage: true,
    } as any),
  orderList: (data: any) => http.post('/myOrderList', data),
  getSignMsg: (data: any) => http.post('/getSignMsg', data, { ignoreErrorPage: true } as any),
  authSign: (data: any) => http.post('/authSign', data, { ignoreErrorPage: true } as any),
  getHwcoupon: (id: string) => http.get(`/getHwcoupon/${id}`),
  getAlipayByOrder: (order: string, params?: any) =>
    http.get(`/getAlipay/${order}`, { params, headers: { from: 'dapp' } }),
  getBinancePayByOrder: (order: string, params?: any) =>
    http.get(`/getBinancePayQrCode/${order}`, { params, headers: { from: 'dapp' } }),
  createPaypalExpressToken: (data: any) => http.post(`/paypalapi/createpaypalexpresstoken`, data),
  setpaymentmethodoncart: (data: any) => http.post('/paypalapi/setpaymentmethodoncart', data),
  paypalPlaceOrder: (data: any) => http.post('/paypalapi/placeorder', data),
  getOrderNo: (order: string) => http.get(`/getOrderNo/${order}`),
  getReviewList: (id: string, params?: any, config?: any) =>
    http.get(`/getReviewList/${id}`, { params, ...config }),
  createReview: (data: any) => http.post(`/createReview`, data),
  voteUpReview: (id: string) => http.post(`/voteReview/${id}/up`),
  unVoteUpReview: (id: string) => http.post(`/unVoteReview/${id}/up`),
  promotionalDiscountsOne: (id: string) => http.get(`/promotionalDiscountsOne/${id}`),
  checkTxid: (data: any) =>
    http.post('/checkTxid', getFormData(data), { contentType: 'multipart/form-data' } as any),
}

export default api
