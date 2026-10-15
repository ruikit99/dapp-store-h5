export function getRouteNameFromPath(pathname: string): string {
  if (pathname === '/' || pathname === '') return 'Home'
  if (pathname.startsWith('/details/')) return 'Details'
  if (pathname === '/shopping/address') return 'ShoppingAddress'
  if (pathname.startsWith('/order/summary')) return 'OrderSummary'
  if (pathname.startsWith('/order/detail/')) return 'OrderDetail'
  if (pathname === '/order/result') return 'OrderResult'
  if (pathname === '/order') return 'Order'
  if (pathname.startsWith('/reviews/')) return 'Reviews'
  return 'Home'
}
