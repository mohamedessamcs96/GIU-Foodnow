// ============================================================================
// services/restaurants.service.js  -  business logic + SQL for restaurants.
//
// Services know about the database and the business rules, but NOTHING about
// HTTP (no req/res). That makes them easy to test and reuse.
// Convention: "not found" => throw AppError(..., 404).
// ============================================================================
import { query } from "../db.js";
import { AppError } from "../utils/AppError.js";
import { withNumbers } from "../utils/money.js";
import { buildUpdate } from "../utils/sql.js";

// Row mappers: convert NUMERIC strings from pg into numbers (see utils/money.js).
const toRestaurant = withNumbers("delivery_fee");

// ----- READ -----------------------------------------------------------------

// List restaurants. Every filter is optional and they combine with AND.
//   cuisine  : exact match, case-insensitive
//   openOnly : only restaurants that are open now
//   search   : text contained in the name (case-insensitive)
export const listRestaurants = async ({ cuisine, openOnly, search }) => {
  // We build the WHERE clause piece by piece. `params` holds the values and
  // `params.length` is the number of the NEXT placeholder ($1, $2, ...).
  const conditions = [];
  const params = [];

  if (cuisine) {
    params.push(cuisine);
    conditions.push(`LOWER(cuisine) = LOWER($${params.length})`);
  }
  if (search) {
    params.push(`%${search}%`); // % = "anything" in LIKE patterns
    conditions.push(`name ILIKE $${params.length}`); // ILIKE = case-insensitive LIKE
  }
  if (openOnly) conditions.push("is_open = true");

  // No filters -> no WHERE at all.
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await query(`SELECT * FROM restaurants ${where} ORDER BY name`, params);

  return rows.map(toRestaurant);
};

// One restaurant by id, or a 404.
export const getRestaurant = async (id) => {
  const { rows } = await query("SELECT * FROM restaurants WHERE id = $1", [id]);
  if (rows.length === 0) throw new AppError("Restaurant not found", 404);
  return toRestaurant(rows[0]);
};

// The menu customers see: only items that are currently available.
export const getMenu = async (restaurantId) => {
  await getRestaurant(restaurantId); // reuse: throws 404 if the restaurant does not exist
  const { rows } = await query(
    "SELECT id, name, price FROM menu_items WHERE restaurant_id = $1 AND is_available = true ORDER BY id",
    [restaurantId]
  );
  return rows.map(withNumbers("price"));
};

// ----- WRITE ----------------------------------------------------------------

// Create a restaurant. Missing optional fields get defaults here.
export const createRestaurant = async ({ name, cuisine, deliveryFee = 0, isOpen = true }) => {
  const { rows } = await query(
    `INSERT INTO restaurants (name, cuisine, delivery_fee, is_open)
     VALUES ($1, $2, $3, $4)
     RETURNING *`, // RETURNING gives us the saved row (with its new id) in one round trip
    // cuisine is stored lowercase so the filter "?cuisine=Italian" always matches
    [name.trim(), cuisine.trim().toLowerCase(), deliveryFee, isOpen]
  );
  return toRestaurant(rows[0]);
};

// Update only the fields the client sent (PATCH semantics).
export const updateRestaurant = async (id, { name, cuisine, deliveryFee, isOpen }) => {
  // Map API field names (camelCase) to column names (snake_case).
  // Fields that are undefined are skipped by buildUpdate.
  const { setClause, params } = buildUpdate({
    name: name?.trim(),
    cuisine: cuisine?.trim().toLowerCase(),
    delivery_fee: deliveryFee,
    is_open: isOpen,
  });

  // The id is the LAST parameter, so its placeholder number is params.length + 1.
  const { rows } = await query(
    `UPDATE restaurants SET ${setClause} WHERE id = $${params.length + 1} RETURNING *`,
    [...params, id]
  );
  if (rows.length === 0) throw new AppError("Restaurant not found", 404);
  return toRestaurant(rows[0]);
};

// Delete a restaurant. Its menu items are removed automatically (ON DELETE
// CASCADE in the schema). If it already has orders, PostgreSQL refuses and the
// error handler turns that into HTTP 409 (we keep order history safe).
export const deleteRestaurant = async (id) => {
  const { rowCount } = await query("DELETE FROM restaurants WHERE id = $1", [id]);
  if (rowCount === 0) throw new AppError("Restaurant not found", 404);
};
