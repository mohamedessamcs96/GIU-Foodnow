DROP TABLE IF EXISTS order_items, orders, menu_items, restaurants CASCADE;

CREATE TABLE restaurants (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  cuisine      VARCHAR(50)  NOT NULL,
  delivery_fee NUMERIC(8,2) NOT NULL DEFAULT 0,
  is_open      BOOLEAN      NOT NULL DEFAULT true
);

CREATE TABLE menu_items (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  price         NUMERIC(8,2) NOT NULL CHECK (price >= 0),
  is_available  BOOLEAN      NOT NULL DEFAULT true
);

CREATE TABLE orders (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT          NOT NULL REFERENCES restaurants(id),
  customer_name VARCHAR(100) NOT NULL,
  address       TEXT         NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','preparing','on_the_way','delivered','cancelled')),
  total         NUMERIC(10,2) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id           SERIAL PRIMARY KEY,
  order_id     INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INT NOT NULL REFERENCES menu_items(id),
  quantity     INT NOT NULL CHECK (quantity > 0),
  unit_price   NUMERIC(8,2) NOT NULL
);

CREATE INDEX idx_menu_items_restaurant ON menu_items (restaurant_id);
CREATE INDEX idx_order_items_order     ON order_items (order_id);
