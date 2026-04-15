// Mandi Business Management System - TypeScript Types

export type UserRole = 'admin' | 'staff' | 'accountant'
export type ArrivalStatus = 'active' | 'settled' | 'cancelled'
export type PaymentType = 'cash' | 'credit'

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: UserRole
  created_at: string
}

export interface Item {
  id: string
  name: string
  unit: string
  created_at: string
}

export interface Farmer {
  id: string
  name: string
  phone: string | null
  address: string | null
  created_at: string
  created_by: string | null
}

export interface Buyer {
  id: string
  name: string
  phone: string | null
  address: string | null
  credit_balance: number
  created_at: string
  created_by: string | null
}

export interface Arrival {
  id: string
  farmer_id: string
  arrival_date: string
  vehicle_number: string | null
  notes: string | null
  status: ArrivalStatus
  created_at: string
  created_by: string | null
  // Joined data
  farmer?: Farmer
  lots?: Lot[]
}

export interface Lot {
  id: string
  arrival_id: string
  item_id: string
  quantity: number
  remaining_quantity: number
  rate: number | null
  created_at: string
  // Joined data
  item?: Item
  arrival?: Arrival
}

export interface Sale {
  id: string
  lot_id: string
  buyer_id: string
  quantity: number
  rate: number
  total_amount: number
  payment_type: PaymentType
  sale_date: string
  created_at: string
  created_by: string | null
  // Joined data
  lot?: Lot & { item?: Item; arrival?: Arrival & { farmer?: Farmer } }
  buyer?: Buyer
}

export interface Payment {
  id: string
  buyer_id: string
  amount: number
  payment_date: string
  notes: string | null
  created_at: string
  created_by: string | null
  // Joined data
  buyer?: Buyer
}

export interface Setting {
  id: string
  key: string
  value: number
  description: string | null
}

export interface FarmerBill {
  id: string
  arrival_id: string
  total_sales: number
  commission_amount: number
  unloading_charges: number
  loading_charges: number
  net_payable: number
  bill_date: string
  is_paid: boolean
  created_at: string
  // Joined data
  arrival?: Arrival & { farmer?: Farmer }
}

// Dashboard Stats
export interface DashboardStats {
  todaySales: number
  todayCommission: number
  totalCredit: number
  activeLots: number
  todayArrivals: number
  todayPayments: number
}

// Form Types
export interface FarmerFormData {
  name: string
  phone: string
  address: string
}

export interface BuyerFormData {
  name: string
  phone: string
  address: string
}

export interface ArrivalFormData {
  farmer_id: string
  arrival_date: string
  vehicle_number: string
  notes: string
}

export interface LotFormData {
  item_id: string
  quantity: number
  rate: number
}

export interface SaleFormData {
  lot_id: string
  buyer_id: string
  quantity: number
  rate: number
  payment_type: PaymentType
}

export interface PaymentFormData {
  buyer_id: string
  amount: number
  payment_date: string
  notes: string
}
