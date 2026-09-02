import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Buyers from './pages/Buyers'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Guide from './pages/Guide'
import Users from './pages/Users'
import Audit from './pages/Audit'
import Calculator from './pages/Calculator'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="products" element={<Products />} />
              <Route path="buyers" element={<Buyers />} />
              <Route path="guide" element={<Guide />} />
              <Route path="users" element={<Users />} />
              <Route path="audit" element={<Audit />} />
              <Route path="calculator" element={<Calculator />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  )
}
