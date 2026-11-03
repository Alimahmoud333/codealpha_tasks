import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { fromCents, toCents } from "../../utils/money.js";
import { serializeCartItem } from "../../utils/serializers.js";

/* A user gets exactly one cart (UNIQUE user_id). Created lazily on first use. */
async function getOrCreateCartId(userId) {
  await pool.execute(
    "INSERT INTO carts (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = user_id",
    [userId],
  );

  const [rows] = await pool.execute("SELECT id FROM carts WHERE user_id = ?", [userId]);
  return rows[0].id;
}

/* Prices always come from the products table at read time, never from the client. */
export async function getCart(userId) {
  const [rows] = await pool.execute(
    `SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price, p.stock, p.image_url
     FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     JOIN products p ON p.id = ci.product_id
     WHERE c.user_id = ? AND p.is_active = 1
     ORDER BY ci.created_at ASC, ci.id ASC`,
    [userId],
  );

  const items = rows.map(serializeCartItem);
  const totalCents = items.reduce((sum, item) => sum + toCents(item.lineTotal), 0);

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    total: fromCents(totalCents),
    hasStockIssues: items.some((item) => item.exceedsStock),
  };
}

function assertWithinStock(requestedTotal, stock) {
  if (stock < 1) {
    throw new AppError(409, "This product is out of stock.");
  }
  if (requestedTotal > stock) {
    throw new AppError(409, `Only ${stock} in stock. You can't have ${requestedTotal} in your cart.`);
  }
}

export async function addItem(userId, { productId, quantity }) {
  const [products] = await pool.execute(
    "SELECT id, stock FROM products WHERE id = ? AND is_active = 1",
    [productId],
  );

  if (!products[0]) throw new AppError(404, "Product not found.");

  const cartId = await getOrCreateCartId(userId);

  const [existing] = await pool.execute(
    "SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?",
    [cartId, productId],
  );

  const newQuantity = (existing[0]?.quantity ?? 0) + quantity;
  assertWithinStock(newQuantity, products[0].stock);

  if (existing[0]) {
    await pool.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", [newQuantity, existing[0].id]);
  } else {
    await pool.execute(
      "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)",
      [cartId, productId, quantity],
    );
  }

  return getCart(userId);
}

export async function updateItem(userId, itemId, { quantity }) {
  // Joining carts on user_id means a user can only touch their own items (no IDOR).
  const [rows] = await pool.execute(
    `SELECT ci.id, p.stock
     FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     JOIN products p ON p.id = ci.product_id
     WHERE ci.id = ? AND c.user_id = ? AND p.is_active = 1`,
    [itemId, userId],
  );

  if (!rows[0]) throw new AppError(404, "Cart item not found.");

  assertWithinStock(quantity, rows[0].stock);
  await pool.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", [quantity, itemId]);

  return getCart(userId);
}

export async function removeItem(userId, itemId) {
  const [result] = await pool.execute(
    `DELETE ci FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     WHERE ci.id = ? AND c.user_id = ?`,
    [itemId, userId],
  );

  if (result.affectedRows === 0) throw new AppError(404, "Cart item not found.");

  return getCart(userId);
}
