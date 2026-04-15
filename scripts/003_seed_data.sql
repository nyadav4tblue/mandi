-- Seed common vegetables/items
INSERT INTO items (name, unit) VALUES
  ('Potato', 'kg'),
  ('Tomato', 'kg'),
  ('Onion', 'kg'),
  ('Cabbage', 'piece'),
  ('Cauliflower', 'piece'),
  ('Carrot', 'kg'),
  ('Brinjal', 'kg'),
  ('Capsicum', 'kg'),
  ('Cucumber', 'kg'),
  ('Bottle Gourd', 'piece'),
  ('Bitter Gourd', 'kg'),
  ('Lady Finger', 'kg'),
  ('Green Chilli', 'kg'),
  ('Spinach', 'bundle'),
  ('Coriander', 'bundle')
ON CONFLICT (name) DO NOTHING;

-- Seed default settings
INSERT INTO settings (key, value, description) VALUES
  ('commission_rate', 5, 'Commission percentage on total sales'),
  ('unloading_charge', 3, 'Charge per unit for unloading (Rs)'),
  ('loading_charge', 2, 'Charge per unit for loading (Rs)')
ON CONFLICT (key) DO NOTHING;
