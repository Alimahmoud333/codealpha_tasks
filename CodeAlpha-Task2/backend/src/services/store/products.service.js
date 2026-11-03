import pool, { withTransaction } from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { serializeProduct } from "../../utils/serializers.js";

/* ORDER BY cannot use placeholders, so the client's `sort` is mapped through this whitelist. */
const SORT_SQL = {
  newest: "p.created_at DESC, p.id DESC",
  price_asc: "p.price ASC, p.id ASC",
  price_desc: "p.price DESC, p.id ASC",
  name_asc: "p.name ASC, p.id ASC",
};

const SELECT_PRODUCT = `
  SELECT p.id, p.name, p.description, p.price, p.stock, p.image_url, p.created_at,
         c.id AS category_id, c.name AS category_name
  FROM products p
  JOIN categories c ON c.id = p.category_id`;

/* Stops "%" and "_" typed by the user from acting as SQL LIKE wildcards. */
const escapeLike = (value) => value.replace(/[\\%_]/g, "\\$&");

export async function listCategories() {
  const [rows] = await pool.execute("SELECT id, name FROM categories ORDER BY name ASC");
  return rows;
}

export async function listProducts({ search, category, sort, page, limit }) {
  const where = ["p.is_active = 1"];
  const params = [];

  if (search) {
    where.push("(p.name LIKE ? OR p.description LIKE ?)");
    const pattern = `%${escapeLike(search)}%`;
    params.push(pattern, pattern);
  }

  if (category) {
    where.push("p.category_id = ?");
    params.push(category);
  }

  const whereSql = where.join(" AND ");
  const offset = (page - 1) * limit;

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM products p WHERE ${whereSql}`,
    params,
  );

  // `limit`, `offset` and `sort` are validated numbers / whitelisted values, never raw input.
  const [rows] = await pool.execute(
    `${SELECT_PRODUCT} WHERE ${whereSql} ORDER BY ${SORT_SQL[sort]} LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  return {
    items: rows.map(serializeProduct),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getProduct(id) {
  const [rows] = await pool.execute(`${SELECT_PRODUCT} WHERE p.id = ? AND p.is_active = 1`, [id]);

  if (!rows[0]) throw new AppError(404, "Product not found.");
  return serializeProduct(rows[0]);
}

async function assertCategoryExists(categoryId) {
  const [rows] = await pool.execute("SELECT id FROM categories WHERE id = ?", [categoryId]);

  if (!rows[0]) {
    throw new AppError(422, "Please correct the highlighted fields.", { categoryId: "This category does not exist." });
  }
}

export async function createProduct(data, imageUrl) {
  await assertCategoryExists(data.categoryId);

  const [result] = await pool.execute(
    `INSERT INTO products (category_id, name, description, price, stock, image_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.categoryId, data.name, data.description, data.price, data.stock, imageUrl ?? null],
  );

  return getProduct(result.insertId);
}

export async function updateProduct(id, data, imageUrl) {
  await getProduct(id); // 404 if missing or deleted
  await assertCategoryExists(data.categoryId);

  // COALESCE keeps the current image when no new one was uploaded.
  await pool.execute(
    `UPDATE products
     SET category_id = ?, name = ?, description = ?, price = ?, stock = ?,
         image_url = COALESCE(?, image_url)
     WHERE id = ? AND is_active = 1`,
    [data.categoryId, data.name, data.description, data.price, data.stock, imageUrl ?? null, id],
  );

  return getProduct(id);
}

/*
 * "Delete" is a soft delete (is_active = 0). order_items still reference the
 * product, and real deletion would break order history. The product is also
 * removed from every cart so nobody can check it out.
 */
export async function deleteProduct(id) {
  await withTransaction(async (connection) => {
    const [result] = await connection.execute(
      "UPDATE products SET is_active = 0 WHERE id = ? AND is_active = 1",
      [id],
    );

    if (result.affectedRows === 0) throw new AppError(404, "Product not found.");

    await connection.execute("DELETE FROM cart_items WHERE product_id = ?", [id]);
  });
}
