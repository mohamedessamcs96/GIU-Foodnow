-- ============================================================================
-- schema.sql  -  creates all tables. Run it with:
--   psql -d foodnow_db -f sql/schema.sql
-- WARNING: it DROPS the tables first, so running it again erases all data.
--
-- Relationships (see the ERD at /doc/architecture):
--   restaurants 1 --- * menu_items
--   restaurants 1 --- * orders
--   orders      1 --- * order_items * --- 1 menu_items
-- ============================================================================

-- Drop in dependency order (CASCADE also removes anything that depends on them).
DROP TABLE IF EXISTS order_items, orders, menu_items, restaurants CASCADE;

-- A place that sells food.
CREATE TABLE restaurants (
  id           SERIAL PRIMARY KEY,          -- auto-incrementing unique id
  name         VARCHAR(100) NOT NULL,
  cuisine      VARCHAR(50)  NOT NULL,
  delivery_fee NUMERIC(8,2) NOT NULL DEFAULT 0,  -- NUMERIC = exact decimals (never use FLOAT for money)
  is_open      BOOLEAN      NOT NULL DEFAULT true   -- closed restaurants cannot receive orders
);

-- A dish that belongs to one restaurant.
CREATE TABLE menu_items (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,  -- FK; deleting a restaurant deletes its menu
  name          VARCHAR(100) NOT NULL,
  price         NUMERIC(8,2) NOT NULL CHECK (price >= 0),  -- the database itself refuses negative prices
  is_available  BOOLEAN      NOT NULL DEFAULT true   -- false = sold out
);

-- One customer order. Items are in order_items.
CREATE TABLE orders (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT          NOT NULL REFERENCES restaurants(id),  -- no CASCADE: a restaurant with orders cannot be deleted
  customer_name VARCHAR(100) NOT NULL,
  address       TEXT         NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','preparing','on_the_way','delivered','cancelled')),
  total         NUMERIC(10,2) NOT NULL,  -- items subtotal + delivery fee, calculated by the API
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- The lines of an order (one row per dish ordered).
CREATE TABLE order_items (
  id           SERIAL PRIMARY KEY,
  order_id     INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,  -- deleting an order deletes its lines
  menu_item_id INT NOT NULL REFERENCES menu_items(id),
  quantity     INT NOT NULL CHECK (quantity > 0),
  unit_price   NUMERIC(8,2) NOT NULL  -- price COPIED at order time, so later menu changes do not alter old orders
);

-- Indexes make lookups by these foreign keys fast (e.g. "menu of restaurant 5").
CREATE INDEX idx_menu_items_restaurant ON menu_items (restaurant_id);
CREATE INDEX idx_order_items_order     ON order_items (order_id);
