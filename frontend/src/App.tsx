import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Buyers from './pages/Buyers'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Placeholder title="Pesanan (Sprint 1 Task 9)" />} />
            <Route path="orders/:id" element={<Placeholder title="Detail Pesanan (Task 9)" />} />
            <Route path="products" element={<Products />} />
            <Route path="buyers" element={<Buyers />} />
            <Route path="guide" element={<Placeholder title="Panduan Ekspor (Task 9b)" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
