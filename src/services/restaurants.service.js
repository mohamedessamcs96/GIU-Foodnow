import { query } from "../db.js";
import { AppError } from "../utils/AppError.js";
import { withNumbers } from "../utils/money.js";

const toRestaurant = withNumbers("delivery_fee");
const toMenuItem = withNumbers("price");

export const listRestaurants = async ({ cuisine, openOnly }) => {
  const conditions = [];
  const params = [];

  if (cuisine) {
    params.push(cuisine);
    conditions.push(`LOWER(cuisine) = LOWER($${params.length})`);
  }
  if (openOnly) conditions.push("is_open = true");

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await query(`SELECT * FROM restaurants ${where} ORDER BY name`, params);

  return rows.map(toRestaurant);
};

export const getRestaurant = async (id) => {
  const { rows } = await query("SELECT * FROM restaurants WHERE id = $1", [id]);
  if (rows.length === 0) throw new AppError("Restaurant not found", 404);
  return toRestaurant(rows[0]);
};

export const getMenu = async (restaurantId) => {
  await getRestaurant(restaurantId); // throws 404 if it doesn't exist
  const { rows } = await query(
    "SELECT id, name, price FROM menu_items WHERE restaurant_id = $1 AND is_available = true ORDER BY id",
    [restaurantId]
  );
  return rows.map(toMenuItem);
};
