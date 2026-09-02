export interface Product {
  id: number
  sku: string
  name: string
  hs_code: string
  description: string
  length_cm: number
  width_cm: number
  height_cm: number
  net_weight_g: number
  gross_weight_g: number
  unit_price_usd: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Buyer {
  id: number
  company_name: string
  country: string
  city: string
  address: string
  contact_name: string
  contact_phone: string
  contact_email: string
  tax_id: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Port {
  id: number
  code: string
  name: string
  country: string
}

export interface Incoterm {
  id: number
  code: string
  description: string
}

export type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'completed'
  | 'cancelled'

export interface OrderItem {
  id: number
  product_id: number
  quantity: number
  unit_price_usd: number
  line_total: number
  product?: Product
}

export interface CompanySetting {
  id: number
  company_name: string
  address: string
  city: string
  country: string
  email: string
  phone: string
  website: string
  nib: string
  npwp: string
  signer_name: string
  signer_title: string
  signature_image: string
  updated_at: string
}

export type ShippingMode = 'courier' | 'lcl' | 'fcl'

export interface Order {
  id: number
  order_no: string
  shipping_mode: ShippingMode
  buyer_id: number
  buyer?: Buyer
  incoterm_id: number
  incoterm?: Incoterm
  port_loading_id: number | null
  port_loading?: Port | null
  port_discharge_id: number | null
  port_discharge?: Port | null
  currency: string
  payment_terms: string
  status: OrderStatus
  notes: string
  total_fob: number
  total_net_kg: number
  total_gross_kg: number
  total_cbm: number
  peb_required: boolean
  items: OrderItem[]
  shipment?: Shipment | null
  created_by: number
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  orders_total: number
  orders_this_month: number
  fob_this_month: number
  by_status: Record<string, number>
  active_shipments: {
    id: number
    order_no: string
    buyer_name: string
    status: OrderStatus
    etd: string | null
    vessel: string
    total_fob: number
  }[]
  recent_docs: { id: number; doc_no: string; doc_type: string; order_id: number; order_no: string; created_at: string }[]
  recent_orders: { id: number; order_no: string; buyer_name: string; status: OrderStatus; total_fob: number; created_at: string }[]
}

export interface Shipment {
  id: number
  order_id: number
  peb_no: string
  npe_no: string
  vessel_name: string
  voyage_no: string
  stuffing_date: string | null
  gate_in_date: string | null
  etd: string | null
  onboard_date: string | null
  pod_date: string | null
  courier: string
  awb_no: string
  pickup_date: string | null
  delivered_date: string | null
  notes: string
}

export interface Document {
  id: number
  doc_no: string
  order_id: number
  doc_type: string
  file_path: string
  created_at: string
}
