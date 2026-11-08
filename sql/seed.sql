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
