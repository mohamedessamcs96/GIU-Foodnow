import { query, withTransaction } from "../db.js";
import { AppError } from "../utils/AppError.js";
import { round2, withNumbers } from "../utils/money.js";

const toOrder = withNumbers("total");
const toOrderItem = withNumbers("unit_price");

export const createOrder = async ({ restaurantId, customerName, address, items }) => {
  // withTransaction is a higher-order function: we hand it the work to do.
  const summary = await withTransaction(async (client) => {
    // 1. restaurant must exist and be open
    const restaurantRes = await client.query("SELECT * FROM restaurants WHERE id = $1", [restaurantId]);
    const restaurant = restaurantRes.rows[0];
    if (!restaurant) throw new AppError("Restaurant not found", 404);
    if (!restaurant.is_open) throw new AppError("Restaurant is closed", 400);

    // 2. load real prices from the DB (never trust prices from the client)
    const ids = items.map((i) => i.menuItemId);
    const menuRes = await client.query(
      `SELECT id, price FROM menu_items
       WHERE restaurant_id = $1 AND is_available = true AND id = ANY($2)`,
      [restaurantId, ids]
    );
    const priceById = new Map(menuRes.rows.map((r) => [r.id, Number(r.price)]));

    // 3. every requested item must belong to this restaurant's menu
    const invalid = items.filter((i) => !priceById.has(i.menuItemId)).map((i) => i.menuItemId);
    if (invalid.length > 0) {
      throw new AppError("Some items are unavailable or not on this menu", 400, { menuItemIds: invalid });
    }

    // 4. calculate the totals with reduce
    const subtotal = round2(items.reduce((sum, i) => sum + priceById.get(i.menuItemId) * i.quantity, 0));
    const deliveryFee = Number(restaurant.delivery_fee);
    const total = round2(subtotal + deliveryFee);

    // 5. save the order, then all of its items
    const orderRes = await client.query(
      `INSERT INTO orders (restaurant_id, customer_name, address, total)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [restaurantId, customerName.trim(), address.trim(), total]
    );
    const orderId = orderRes.rows[0].id;

    await Promise.all(
      items.map((i) =>
        client.query(
          `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [orderId, i.menuItemId, i.quantity, priceById.get(i.menuItemId)]
        )
      )
    );

    return { orderId, subtotal, deliveryFee };
  });

  const order = await getOrder(summary.orderId);
  return { ...order, subtotal: summary.subtotal, deliveryFee: summary.deliveryFee };
};

export const getOrder = async (id) => {
  const orderRes = await query(
    `SELECT o.*, r.name AS restaurant_name
     FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
     WHERE o.id = $1`,
    [id]
  );
  if (orderRes.rows.length === 0) throw new AppError("Order not found", 404);

  const itemsRes = await query(
    `SELECT oi.menu_item_id, m.name, oi.quantity, oi.unit_price
     FROM order_items oi JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE oi.order_id = $1 ORDER BY oi.id`,
    [id]
  );

  return { ...toOrder(orderRes.rows[0]), items: itemsRes.rows.map(toOrderItem) };
};

export const updateStatus = async (id, status) => {
  const { rowCount } = await query("UPDATE orders SET status = $1 WHERE id = $2", [status, id]);
  if (rowCount === 0) throw new AppError("Order not found", 404);
  return getOrder(id);
};
