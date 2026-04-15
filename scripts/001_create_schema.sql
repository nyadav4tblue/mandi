-- Mandi Business Management System - Database Schema

-- 1. User Profiles with Roles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'accountant')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Items (Vegetables)
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  unit TEXT DEFAULT 'kg',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Farmers
CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. Buyers
CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  credit_balance DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5. Daily Arrivals (Farmer Vehicle Entry)
CREATE TABLE IF NOT EXISTS arrivals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  arrival_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vehicle_number TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'settled', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 6. Lots (Inventory per Farmer per Item)
CREATE TABLE IF NOT EXISTS lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arrival_id UUID NOT NULL REFERENCES arrivals(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  quantity DECIMAL(10,2) NOT NULL,
  remaining_quantity DECIMAL(10,2) NOT NULL,
  rate DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Sales
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES buyers(id),
  quantity DECIMAL(10,2) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'credit')),
  sale_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 8. Payments (Credit Settlements)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 9. Settings (Commission & Labor Rates)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  description TEXT
);

-- 10. Farmer Bills (Settlement Records)
CREATE TABLE IF NOT EXISTS farmer_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arrival_id UUID NOT NULL REFERENCES arrivals(id),
  total_sales DECIMAL(12,2) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  unloading_charges DECIMAL(12,2) NOT NULL,
  loading_charges DECIMAL(12,2) DEFAULT 0,
  net_payable DECIMAL(12,2) NOT NULL,
  bill_date DATE DEFAULT CURRENT_DATE,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_arrivals_farmer ON arrivals(farmer_id);
CREATE INDEX IF NOT EXISTS idx_arrivals_date ON arrivals(arrival_date);
CREATE INDEX IF NOT EXISTS idx_lots_arrival ON lots(arrival_id);
CREATE INDEX IF NOT EXISTS idx_sales_lot ON sales(lot_id);
CREATE INDEX IF NOT EXISTS idx_sales_buyer ON sales(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_payments_buyer ON payments(buyer_id);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_bills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for items
DROP POLICY IF EXISTS "items_select_all" ON items;
DROP POLICY IF EXISTS "items_insert_all" ON items;
DROP POLICY IF EXISTS "items_update_all" ON items;
CREATE POLICY "items_select_all" ON items FOR SELECT TO authenticated USING (true);
CREATE POLICY "items_insert_all" ON items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "items_update_all" ON items FOR UPDATE TO authenticated USING (true);

-- RLS Policies for farmers
DROP POLICY IF EXISTS "farmers_select_all" ON farmers;
DROP POLICY IF EXISTS "farmers_insert_all" ON farmers;
DROP POLICY IF EXISTS "farmers_update_all" ON farmers;
DROP POLICY IF EXISTS "farmers_delete_all" ON farmers;
CREATE POLICY "farmers_select_all" ON farmers FOR SELECT TO authenticated USING (true);
CREATE POLICY "farmers_insert_all" ON farmers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "farmers_update_all" ON farmers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "farmers_delete_all" ON farmers FOR DELETE TO authenticated USING (true);

-- RLS Policies for buyers
DROP POLICY IF EXISTS "buyers_select_all" ON buyers;
DROP POLICY IF EXISTS "buyers_insert_all" ON buyers;
DROP POLICY IF EXISTS "buyers_update_all" ON buyers;
DROP POLICY IF EXISTS "buyers_delete_all" ON buyers;
CREATE POLICY "buyers_select_all" ON buyers FOR SELECT TO authenticated USING (true);
CREATE POLICY "buyers_insert_all" ON buyers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "buyers_update_all" ON buyers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "buyers_delete_all" ON buyers FOR DELETE TO authenticated USING (true);

-- RLS Policies for arrivals
DROP POLICY IF EXISTS "arrivals_select_all" ON arrivals;
DROP POLICY IF EXISTS "arrivals_insert_all" ON arrivals;
DROP POLICY IF EXISTS "arrivals_update_all" ON arrivals;
DROP POLICY IF EXISTS "arrivals_delete_all" ON arrivals;
CREATE POLICY "arrivals_select_all" ON arrivals FOR SELECT TO authenticated USING (true);
CREATE POLICY "arrivals_insert_all" ON arrivals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "arrivals_update_all" ON arrivals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "arrivals_delete_all" ON arrivals FOR DELETE TO authenticated USING (true);

-- RLS Policies for lots
DROP POLICY IF EXISTS "lots_select_all" ON lots;
DROP POLICY IF EXISTS "lots_insert_all" ON lots;
DROP POLICY IF EXISTS "lots_update_all" ON lots;
DROP POLICY IF EXISTS "lots_delete_all" ON lots;
CREATE POLICY "lots_select_all" ON lots FOR SELECT TO authenticated USING (true);
CREATE POLICY "lots_insert_all" ON lots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lots_update_all" ON lots FOR UPDATE TO authenticated USING (true);
CREATE POLICY "lots_delete_all" ON lots FOR DELETE TO authenticated USING (true);

-- RLS Policies for sales
DROP POLICY IF EXISTS "sales_select_all" ON sales;
DROP POLICY IF EXISTS "sales_insert_all" ON sales;
DROP POLICY IF EXISTS "sales_update_all" ON sales;
DROP POLICY IF EXISTS "sales_delete_all" ON sales;
CREATE POLICY "sales_select_all" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales_insert_all" ON sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sales_update_all" ON sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "sales_delete_all" ON sales FOR DELETE TO authenticated USING (true);

-- RLS Policies for payments
DROP POLICY IF EXISTS "payments_select_all" ON payments;
DROP POLICY IF EXISTS "payments_insert_all" ON payments;
DROP POLICY IF EXISTS "payments_update_all" ON payments;
DROP POLICY IF EXISTS "payments_delete_all" ON payments;
CREATE POLICY "payments_select_all" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "payments_insert_all" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "payments_update_all" ON payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "payments_delete_all" ON payments FOR DELETE TO authenticated USING (true);

-- RLS Policies for settings
DROP POLICY IF EXISTS "settings_select_all" ON settings;
DROP POLICY IF EXISTS "settings_insert_all" ON settings;
DROP POLICY IF EXISTS "settings_update_all" ON settings;
CREATE POLICY "settings_select_all" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_insert_all" ON settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "settings_update_all" ON settings FOR UPDATE TO authenticated USING (true);

-- RLS Policies for farmer_bills
DROP POLICY IF EXISTS "farmer_bills_select_all" ON farmer_bills;
DROP POLICY IF EXISTS "farmer_bills_insert_all" ON farmer_bills;
DROP POLICY IF EXISTS "farmer_bills_update_all" ON farmer_bills;
CREATE POLICY "farmer_bills_select_all" ON farmer_bills FOR SELECT TO authenticated USING (true);
CREATE POLICY "farmer_bills_insert_all" ON farmer_bills FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "farmer_bills_update_all" ON farmer_bills FOR UPDATE TO authenticated USING (true);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'staff')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Seed default items (common vegetables)
INSERT INTO items (name, unit) VALUES
  ('Potato', 'kg'),
  ('Tomato', 'kg'),
  ('Onion', 'kg'),
  ('Cabbage', 'piece'),
  ('Cauliflower', 'piece'),
  ('Carrot', 'kg'),
  ('Brinjal', 'kg'),
  ('Capsicum', 'kg'),
  ('Green Chilli', 'kg'),
  ('Cucumber', 'kg'),
  ('Spinach', 'bundle'),
  ('Coriander', 'bundle'),
  ('Radish', 'kg'),
  ('Bitter Gourd', 'kg'),
  ('Bottle Gourd', 'piece')
ON CONFLICT (name) DO NOTHING;

-- Seed default settings
INSERT INTO settings (key, value, description) VALUES
  ('commission_rate', 5, 'Commission percentage on total sales'),
  ('unloading_charge', 3, 'Unloading charge per unit (Rs)'),
  ('loading_charge', 2, 'Loading charge per unit (Rs)')
ON CONFLICT (key) DO NOTHING;
