import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '@/pages/layout/AppShell'
import HomePage from '@/pages/home'
import DetailsPage from '@/pages/details'
import ShippingAddressPage from '@/pages/shippingAddress'
import OrderSummaryPage from '@/pages/order/Summary'
import OrderListPage from '@/pages/order/List'
import OrderDetailPage from '@/pages/order/Detail'
import OrderResultPage from '@/pages/order/Result'
import NotFoundPage from '@/pages/error'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="details/:sku" element={<DetailsPage />} />
        <Route path="order" element={<OrderListPage />} />
        <Route path="shopping/address" element={<ShippingAddressPage />} />
        <Route path="order/detail/:id" element={<OrderDetailPage />} />
        <Route path="order/summary" element={<OrderSummaryPage />} />
        <Route path="order/result" element={<OrderResultPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
