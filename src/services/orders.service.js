// ============================================================================
// services/orders.service.js  -  the heart of the app: ordering food.
// ============================================================================
import { query, withTransaction } from "../db.js";
import { STATUS_TRANSITIONS } from "../constants/orderStatus.js";
import { AppError } from "../utils/AppError.js";
import { round2, withNumbers } from "../utils/money.js";

// Row mappers (NUMERIC string -> number).
const toOrder = withNumbers("total");
const toOrderItem = withNumbers("unit_price");

// ----------------------------------------------------------------------------
// CREATE an order.
// Everything runs inside ONE transaction: either the order AND all its items
// are saved, or nothing is.
// ----------------------------------------------------------------------------
export const createOrder = async ({ restaurantId, customerName, address, items }) => {
  // withTransaction (db.js) is a higher-order function: we pass it the work.
  const summary = await withTransaction(async (client) => {
    // STEP 1: the restaurant must exist and be open.
    const restaurantRes = await client.query("SELECT * FROM restaurants WHERE id = $1", [restaurantId]);
    const restaurant = restaurantRes.rows[0];
    if (!restaurant) throw new AppError("Restaurant not found", 404);
    if (!restaurant.is_open) throw new AppError("Restaurant is closed", 400);

    // STEP 2: load the REAL prices from the database.
    // Never trust prices sent by the client: anyone could send price = 0.
    // `= ANY($2)` means "id is in this array".
    const ids = items.map((i) => i.menuItemId);
    const menuRes = await client.query(
      `SELECT id, price FROM menu_items
       WHERE restaurant_id = $1 AND is_available = true AND id = ANY($2)`,
      [restaurantId, ids]
    );
    // A Map gives fast lookups: priceById.get(3) -> 25
    const priceById = new Map(menuRes.rows.map((r) => [r.id, Number(r.price)]));

    // STEP 3: every requested item must have been found above. Anything missing
    // is unavailable OR belongs to a different restaurant.
    const invalid = items.filter((i) => !priceById.has(i.menuItemId)).map((i) => i.menuItemId);
    if (invalid.length > 0) {
      throw new AppError("Some items are unavailable or not on this menu", 400, { menuItemIds: invalid });
    }

    // STEP 4: calculate the money.  total = sum(price x quantity) + delivery fee
    // `reduce` folds the array into one number, starting from 0.
    const subtotal = round2(items.reduce((sum, i) => sum + priceById.get(i.menuItemId) * i.quantity, 0));
    const deliveryFee = Number(restaurant.delivery_fee);
    const total = round2(subtotal + deliveryFee);

    // STEP 5a: save the order row; RETURNING id gives us its new id.
    const orderRes = await client.query(
      `INSERT INTO orders (restaurant_id, customer_name, address, total)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [restaurantId, customerName.trim(), address.trim(), total]
    );
    const orderId = orderRes.rows[0].id;

    // STEP 5b: save ALL items with ONE query. `unnest` turns three parallel
    // arrays into rows (one row per item). Faster than one INSERT per item.
    // unit_price is a SNAPSHOT of the price now, so later menu price changes
    // never alter old orders.
    await client.query(
      `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price)
       SELECT $1, * FROM unnest($2::int[], $3::int[], $4::numeric[])`,
      [
        orderId,
        items.map((i) => i.menuItemId),
        items.map((i) => i.quantity),
        items.map((i) => priceById.get(i.menuItemId)),
      ]
    );

    return { orderId, subtotal, deliveryFee };
  }); // <- COMMIT happens here. If anything above threw, ROLLBACK happened instead.

  // Read the saved order back (outside the transaction) and add the money breakdown.
  const order = await getOrder(summary.orderId);
  return { ...order, subtotal: summary.subtotal, deliveryFee: summary.deliveryFee };
};

// ----------------------------------------------------------------------------
// READ one order, including its line items.
// ----------------------------------------------------------------------------
export const getOrder = async (id) => {
  // JOIN restaurants so the response can show the restaurant's name.
  const orderRes = await query(
    `SELECT o.*, r.name AS restaurant_name
     FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
     WHERE o.id = $1`,
    [id]
  );
  if (orderRes.rows.length === 0) throw new AppError("Order not found", 404);

  // JOIN menu_items to show each dish's name next to quantity and price paid.
  const itemsRes = await query(
    `SELECT oi.menu_item_id, m.name, oi.quantity, oi.unit_price
     FROM order_items oi JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE oi.order_id = $1 ORDER BY oi.id`,
    [id]
  );

  return { ...toOrder(orderRes.rows[0]), items: itemsRes.rows.map(toOrderItem) };
};

// ----------------------------------------------------------------------------
// LIST orders with optional filters and pagination.
// Pagination = returning a page at a time instead of thousands of rows.
//   limit  : how many rows in this page
//   offset : how many rows to skip (page 2 with limit 20 -> offset 20)
// ----------------------------------------------------------------------------
export const listOrders = async ({ status, restaurantId, limit, offset }) => {
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }
  if (restaurantId) {
    params.push(restaurantId);
    conditions.push(`o.restaurant_id = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  // Total number of matching rows (ignoring paging) so clients can build page buttons.
  // ::int converts COUNT's bigint (returned as a string by pg) to a normal number.
  const countRes = await query(`SELECT COUNT(*)::int AS total FROM orders o ${where}`, params);

  // The page itself. Newest first; `o.id DESC` breaks ties so paging is stable.
  const rowsRes = await query(
    `SELECT o.*, r.name AS restaurant_name
     FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
     ${where}
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return { total: countRes.rows[0].total, limit, offset, data: rowsRes.rows.map(toOrder) };
};

// ----------------------------------------------------------------------------
// CHANGE the status of an order, following the state machine
// (constants/orderStatus.js).
// ----------------------------------------------------------------------------
export const updateStatus = async (id, nextStatus) => {
  await withTransaction(async (client) => {
    // FOR UPDATE locks this row until the transaction ends. If two requests
    // change the same order at the same time, the second waits, then sees the
    // new status and is validated against it. Prevents race conditions.
    const { rows } = await client.query("SELECT status FROM orders WHERE id = $1 FOR UPDATE", [id]);
    if (rows.length === 0) throw new AppError("Order not found", 404);

    // Is the move allowed from the current status?
    const current = rows[0].status;
    if (!STATUS_TRANSITIONS[current].includes(nextStatus)) {
      // 409 Conflict = "valid request, but not valid for the current state".
      throw new AppError(`Cannot change status from '${current}' to '${nextStatus}'`, 409, {
        allowed: STATUS_TRANSITIONS[current],
      });
    }
    await client.query("UPDATE orders SET status = $1 WHERE id = $2", [nextStatus, id]);
  });
  return getOrder(id);
};

// Shortcut used by POST /orders/:id/cancel. Same rules apply, so a delivered
// order cannot be cancelled.
export const cancelOrder = (id) => updateStatus(id, "cancelled");
