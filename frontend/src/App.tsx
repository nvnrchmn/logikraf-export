import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Placeholder title="Pesanan" />} />
            <Route path="products" element={<Placeholder title="Produk" />} />
            <Route path="buyers" element={<Placeholder title="Buyer" />} />
            <Route path="guide" element={<Placeholder title="Panduan Ekspor" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
