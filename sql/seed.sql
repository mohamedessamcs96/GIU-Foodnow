-- ============================================================================
-- seed.sql  -  sample data so the API has something to return.
-- Run AFTER schema.sql:  psql -d foodnow_db -f sql/seed.sql
-- ids are generated automatically (1, 2, 3...), so menu_items below refer to
-- restaurants 1, 2, 3 in the order they were inserted.
-- ============================================================================

-- Restaurant 3 is closed on purpose, to test the "Restaurant is closed" error.
INSERT INTO restaurants (name, cuisine, delivery_fee, is_open) VALUES
  ('Koshary El Tahrir', 'egyptian', 15.00, true),
  ('Pizza Corner',      'italian',  20.00, true),
  ('Grill House',       'grill',    25.00, false);

INSERT INTO menu_items (restaurant_id, name, price) VALUES
  (1, 'Koshary Medium', 45.00),
  (1, 'Koshary Large',  60.00),
  (1, 'Rice Pudding',   25.00),
  (2, 'Margherita',     120.00),
  (2, 'Pepperoni',      150.00),
  (2, 'Garlic Bread',   40.00),
  (3, 'Mixed Grill',    300.00);
