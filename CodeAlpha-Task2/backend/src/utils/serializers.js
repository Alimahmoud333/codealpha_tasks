import { fromCents, toCents } from "./money.js";

/*
 * Converts database rows (snake_case, DECIMAL strings) into the JSON shape
 * the API returns (camelCase, numbers). Password hashes are never included.
 */

/* The logged-in user's own account (includes private fields). */
export const serializeUser = (row) => ({
  id: row.id,
  username: row.username,
  name: row.name,
  email: row.email,
  role: row.role,
  bio: row.bio ?? "",
  avatarUrl: row.avatar_url ?? null,
  createdAt: row.created_at,
});

/* What other people may see: no email, no role. */
export const serializePublicUser = (row) => ({
  id: row.id,
  username: row.username,
  name: row.name,
  bio: row.bio ?? "",
  avatarUrl: row.avatar_url ?? null,
});

const serializeAuthor = (row) => ({
  id: row.author_id,
  username: row.username,
  name: row.author_name,
  avatarUrl: row.avatar_url ?? null,
});

export const serializePost = (row) => ({
  id: row.id,
  content: row.content,
  imageUrl: row.image_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  author: serializeAuthor(row),
  likeCount: Number(row.like_count),
  commentCount: Number(row.comment_count),
  likedByMe: Boolean(Number(row.liked_by_me)),
});

export const serializeComment = (row) => ({
  id: row.id,
  postId: row.post_id,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  author: serializeAuthor(row),
});

export const serializeProduct = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: Number(row.price),
  stock: row.stock,
  inStock: row.stock > 0,
  imageUrl: row.image_url,
  category: { id: row.category_id, name: row.category_name },
  createdAt: row.created_at,
});

export const serializeCartItem = (row) => {
  const unitPriceCents = toCents(row.price);

  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    imageUrl: row.image_url,
    unitPrice: fromCents(unitPriceCents),
    quantity: row.quantity,
    stock: row.stock,
    exceedsStock: row.quantity > row.stock,
    lineTotal: fromCents(unitPriceCents * row.quantity),
  };
};

export const serializeOrderItem = (row) => ({
  id: row.id,
  productId: row.product_id,
  name: row.product_name,
  unitPrice: Number(row.unit_price),
  quantity: row.quantity,
  lineTotal: Number(row.line_total),
});

export const serializeOrder = (row, items = []) => ({
  id: row.id,
  status: row.status,
  total: Number(row.total_amount),
  paymentMethod: row.payment_method,
  notes: row.notes,
  shipping: {
    fullName: row.shipping_full_name,
    phone: row.shipping_phone,
    address: row.shipping_address,
    city: row.shipping_city,
    postalCode: row.shipping_postal_code,
    country: row.shipping_country,
  },
  itemCount: row.item_count !== undefined ? Number(row.item_count) : items.reduce((n, i) => n + i.quantity, 0),
  customer: row.customer_name ? { name: row.customer_name, email: row.customer_email } : undefined,
  createdAt: row.created_at,
  items: items.map(serializeOrderItem),
});
