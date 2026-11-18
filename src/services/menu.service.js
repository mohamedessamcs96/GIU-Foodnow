// ============================================================================
// services/menu.service.js  -  business logic + SQL for menu items.
// (Reading a restaurant's menu lives in restaurants.service.js.)
// ============================================================================
import { query } from "../db.js";
import { AppError } from "../utils/AppError.js";
import { withNumbers } from "../utils/money.js";
import { buildUpdate } from "../utils/sql.js";
import { getRestaurant } from "./restaurants.service.js";

const toMenuItem = withNumbers("price");

// Add a new dish to a restaurant's menu.
export const addMenuItem = async (restaurantId, { name, price, isAvailable = true }) => {
  await getRestaurant(restaurantId); // 404 if the restaurant does not exist

  const { rows } = await query(
    `INSERT INTO menu_items (restaurant_id, name, price, is_available)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [restaurantId, name.trim(), price, isAvailable]
  );
  return toMenuItem(rows[0]);
};

// Change a dish (rename, new price, mark sold out / back in stock).
// Old orders keep their price because order_items stores its own unit_price.
export const updateMenuItem = async (id, { name, price, isAvailable }) => {
  const { setClause, params } = buildUpdate({
    name: name?.trim(),
    price,
    is_available: isAvailable,
  });

  const { rows } = await query(
    `UPDATE menu_items SET ${setClause} WHERE id = $${params.length + 1} RETURNING *`,
    [...params, id]
  );
  if (rows.length === 0) throw new AppError("Menu item not found", 404);
  return toMenuItem(rows[0]);
};
