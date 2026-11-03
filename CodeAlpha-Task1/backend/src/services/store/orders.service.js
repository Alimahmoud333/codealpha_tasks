import pool, { withTransaction } from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { ORDER_TRANSITIONS, USER_ROLES } from "../../utils/constants.js";
import { fromCents, toCents } from "../../utils/money.js";
import { serializeOrder } from "../../utils/serializers.js";

const ORDER_SELECT = `
  SELECT o.*, u.name AS customer_name, u.email AS customer_email
  FROM orders o
  JOIN users u ON u.id = o.user_id`;

/* Same as ORDER_SELECT plus the total number of units, for list pages. */
const ORDER_LIST_SELECT = `
  SELECT o.*, u.name AS customer_name, u.email AS customer_email,
         (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
  FROM orders o
  JOIN users u ON u.id = o.user_id`;

async function loadOrder(db, orderId) {
  const [orders] = await db.execute(`${ORDER_SELECT} WHERE o.id = ?`, [orderId]);
  if (!orders[0]) return null;

  const [items] = await db.execute(
    "SELECT id, product_id, product_name, unit_price, quantity, line_total FROM order_items WHERE order_id = ? ORDER BY id",
    [orderId],
  );

  return { row: orders[0], order: serializeOrder(orders[0], items) };
}

/*
 * CHECKOUT: everything below happens in ONE transaction. If any step fails
 * (for example not enough stock) nothing is saved: no order, no stock change,
 * and the cart is untouched.
 *
 *  1. Read the user's cart items.
 *  2. Lock the product rows with SELECT ... FOR UPDATE (in id order, to avoid
 *     deadlocks). Two customers buying the last item can't both succeed:
 *     the second waits, then sees the reduced stock.
 *  3. Validate availability and stock; take prices from the DB, not the client.
 *  4. Insert the order and its items (price + name copied as a snapshot).
 *  5. Decrement stock, then empty the cart.
 */
export async function createOrder(userId, shipping) {
  const orderId = await withTransaction(async (connection) => {
    const [carts] = await connection.execute("SELECT id FROM carts WHERE user_id = ?", [userId]);

    const [cartItems] = carts[0]
      ? await connection.execute(
          "SELECT product_id, quantity FROM cart_items WHERE cart_id = ? ORDER BY product_id",
          [carts[0].id],
        )
      : [[]];

    if (cartItems.length === 0) {
      throw new AppError(400, "Your cart is empty.");
    }

    const productIds = cartItems.map((item) => item.product_id);
    const placeholders = productIds.map(() => "?").join(", ");

    const [products] = await connection.execute(
      `SELECT id, name, price, stock, is_active FROM products WHERE id IN (${placeholders}) ORDER BY id FOR UPDATE`,
      productIds,
    );

    const productsById = new Map(products.map((product) => [product.id, product]));
    const problems = [];
    const lines = [];
    let totalCents = 0;

    for (const item of cartItems) {
      const product = productsById.get(item.product_id);

      if (!product || !product.is_active) {
        problems.push({ productId: item.product_id, name: product?.name ?? "Unknown product", requested: item.quantity, available: 0 });
        continue;
      }

      if (item.quantity > product.stock) {
        problems.push({ productId: product.id, name: product.name, requested: item.quantity, available: product.stock });
        continue;
      }

      const unitPriceCents = toCents(product.price);
      totalCents += unitPriceCents * item.quantity;
      lines.push({ product, quantity: item.quantity, unitPriceCents });
    }

    if (problems.length > 0) {
      throw new AppError(409, "Some items are no longer available in the quantity you selected.", { items: problems });
    }

    const [orderResult] = await connection.execute(
      `INSERT INTO orders
         (user_id, total_amount, shipping_full_name, shipping_phone, shipping_address,
          shipping_city, shipping_postal_code, shipping_country, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        fromCents(totalCents),
        shipping.fullName,
        shipping.phone,
        shipping.address,
        shipping.city,
        shipping.postalCode,
        shipping.country,
        shipping.notes || null,
      ],
    );

    for (const line of lines) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderResult.insertId,
          line.product.id,
          line.product.name,
          fromCents(line.unitPriceCents),
          line.quantity,
          fromCents(line.unitPriceCents * line.quantity),
        ],
      );

      // The WHERE stock >= ? guard is a second safety net on top of the row lock.
      const [stockResult] = await connection.execute(
        "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
        [line.quantity, line.product.id, line.quantity],
      );

      if (stockResult.affectedRows !== 1) {
        throw new AppError(409, `Not enough stock for ${line.product.name}.`);
      }
    }

    await connection.execute("DELETE FROM cart_items WHERE cart_id = ?", [carts[0].id]);

    return orderResult.insertId;
  });

  return (await loadOrder(pool, orderId)).order;
}

export async function listOrdersForUser(userId, { page, limit }) {
  const offset = (page - 1) * limit;

  const [[{ total }]] = await pool.execute("SELECT COUNT(*) AS total FROM orders WHERE user_id = ?", [userId]);

  const [rows] = await pool.execute(
    `${ORDER_LIST_SELECT}
     WHERE o.user_id = ? ORDER BY o.created_at DESC, o.id DESC LIMIT ${limit} OFFSET ${offset}`,
    [userId],
  );

  return {
    items: rows.map((row) => serializeOrder(row)),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/* Owners see their own orders; admins can see any. Others get 404 (not 403) so ids can't be probed. */
export async function getOrderForUser(user, orderId) {
  const loaded = await loadOrder(pool, orderId);

  if (!loaded || (loaded.row.user_id !== user.id && user.role !== USER_ROLES.ADMIN)) {
    throw new AppError(404, "Order not found.");
  }

  return loaded.order;
}

/* ---------------- Admin ---------------- */

export async function listAllOrders({ status, page, limit }) {
  const where = [];
  const params = [];

  if (status) {
    where.push("o.status = ?");
    params.push(status);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * limit;

  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM orders o ${whereSql}`, params);

  const [rows] = await pool.execute(
    `${ORDER_LIST_SELECT}
     ${whereSql} ORDER BY o.created_at DESC, o.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  return {
    items: rows.map((row) => serializeOrder(row)),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/*
 * Status changes follow ORDER_TRANSITIONS (e.g. delivered orders can't change).
 * Cancelling returns the items to stock, inside the same transaction.
 */
export async function updateOrderStatus(orderId, newStatus) {
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute("SELECT id, status FROM orders WHERE id = ? FOR UPDATE", [orderId]);

    if (!rows[0]) throw new AppError(404, "Order not found.");

    const current = rows[0].status;

    if (!ORDER_TRANSITIONS[current].includes(newStatus)) {
      throw new AppError(409, `An order that is "${current}" cannot be changed to "${newStatus}".`);
    }

    if (newStatus === "cancelled") {
      const [items] = await connection.execute(
        "SELECT product_id, quantity FROM order_items WHERE order_id = ? ORDER BY product_id",
        [orderId],
      );

      for (const item of items) {
        await connection.execute("UPDATE products SET stock = stock + ? WHERE id = ?", [item.quantity, item.product_id]);
      }
    }

    await connection.execute("UPDATE orders SET status = ? WHERE id = ?", [newStatus, orderId]);
  });

  return (await loadOrder(pool, orderId)).order;
}
