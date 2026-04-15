-- RLS policies (safe to re-run after 001_create_schema.sql)
-- Drops each policy if present, then recreates.

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

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Items policies (all authenticated users can read)
DROP POLICY IF EXISTS "items_select_all" ON items;
DROP POLICY IF EXISTS "items_insert_all" ON items;
CREATE POLICY "items_select_all" ON items FOR SELECT TO authenticated USING (true);
CREATE POLICY "items_insert_all" ON items FOR INSERT TO authenticated WITH CHECK (true);

-- Farmers policies (all authenticated users can CRUD)
DROP POLICY IF EXISTS "farmers_select_all" ON farmers;
DROP POLICY IF EXISTS "farmers_insert_all" ON farmers;
DROP POLICY IF EXISTS "farmers_update_all" ON farmers;
DROP POLICY IF EXISTS "farmers_delete_all" ON farmers;
CREATE POLICY "farmers_select_all" ON farmers FOR SELECT TO authenticated USING (true);
CREATE POLICY "farmers_insert_all" ON farmers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "farmers_update_all" ON farmers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "farmers_delete_all" ON farmers FOR DELETE TO authenticated USING (true);

-- Buyers policies
DROP POLICY IF EXISTS "buyers_select_all" ON buyers;
DROP POLICY IF EXISTS "buyers_insert_all" ON buyers;
DROP POLICY IF EXISTS "buyers_update_all" ON buyers;
DROP POLICY IF EXISTS "buyers_delete_all" ON buyers;
CREATE POLICY "buyers_select_all" ON buyers FOR SELECT TO authenticated USING (true);
CREATE POLICY "buyers_insert_all" ON buyers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "buyers_update_all" ON buyers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "buyers_delete_all" ON buyers FOR DELETE TO authenticated USING (true);

-- Arrivals policies
DROP POLICY IF EXISTS "arrivals_select_all" ON arrivals;
DROP POLICY IF EXISTS "arrivals_insert_all" ON arrivals;
DROP POLICY IF EXISTS "arrivals_update_all" ON arrivals;
DROP POLICY IF EXISTS "arrivals_delete_all" ON arrivals;
CREATE POLICY "arrivals_select_all" ON arrivals FOR SELECT TO authenticated USING (true);
CREATE POLICY "arrivals_insert_all" ON arrivals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "arrivals_update_all" ON arrivals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "arrivals_delete_all" ON arrivals FOR DELETE TO authenticated USING (true);

-- Lots policies
DROP POLICY IF EXISTS "lots_select_all" ON lots;
DROP POLICY IF EXISTS "lots_insert_all" ON lots;
DROP POLICY IF EXISTS "lots_update_all" ON lots;
DROP POLICY IF EXISTS "lots_delete_all" ON lots;
CREATE POLICY "lots_select_all" ON lots FOR SELECT TO authenticated USING (true);
CREATE POLICY "lots_insert_all" ON lots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lots_update_all" ON lots FOR UPDATE TO authenticated USING (true);
CREATE POLICY "lots_delete_all" ON lots FOR DELETE TO authenticated USING (true);

-- Sales policies
DROP POLICY IF EXISTS "sales_select_all" ON sales;
DROP POLICY IF EXISTS "sales_insert_all" ON sales;
DROP POLICY IF EXISTS "sales_update_all" ON sales;
DROP POLICY IF EXISTS "sales_delete_all" ON sales;
CREATE POLICY "sales_select_all" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales_insert_all" ON sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sales_update_all" ON sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "sales_delete_all" ON sales FOR DELETE TO authenticated USING (true);

-- Payments policies
DROP POLICY IF EXISTS "payments_select_all" ON payments;
DROP POLICY IF EXISTS "payments_insert_all" ON payments;
DROP POLICY IF EXISTS "payments_update_all" ON payments;
CREATE POLICY "payments_select_all" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "payments_insert_all" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "payments_update_all" ON payments FOR UPDATE TO authenticated USING (true);

-- Settings policies (all can read, only authenticated can update)
DROP POLICY IF EXISTS "settings_select_all" ON settings;
DROP POLICY IF EXISTS "settings_update_all" ON settings;
CREATE POLICY "settings_select_all" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_update_all" ON settings FOR UPDATE TO authenticated USING (true);

-- Farmer Bills policies
DROP POLICY IF EXISTS "farmer_bills_select_all" ON farmer_bills;
DROP POLICY IF EXISTS "farmer_bills_insert_all" ON farmer_bills;
DROP POLICY IF EXISTS "farmer_bills_update_all" ON farmer_bills;
CREATE POLICY "farmer_bills_select_all" ON farmer_bills FOR SELECT TO authenticated USING (true);
CREATE POLICY "farmer_bills_insert_all" ON farmer_bills FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "farmer_bills_update_all" ON farmer_bills FOR UPDATE TO authenticated USING (true);
