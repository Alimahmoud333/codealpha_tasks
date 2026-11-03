# API Reference — Task 1 (E-commerce) and Task 2 (Social media)

Base URL: `http://localhost:5000/api`

All bodies are JSON unless noted. Protected endpoints need the header
`Authorization: Bearer <token>` (the token is returned by register/login).

**Success:** `{ "data": ... }` (lists also include `"meta": { page, limit, total, totalPages }`)
**Error:** `{ "error": { "message": "...", "details": { "field": "message" } } }`

| Status | Meaning |
|---|---|
| 400 | Bad request (e.g. checkout with an empty cart, malformed JSON) |
| 401 | Missing, invalid or expired token / wrong credentials |
| 403 | Logged in but not allowed (e.g. customer calling an admin endpoint) |
| 404 | Not found, **or not yours** (other users' orders and cart items return 404, not 403) |
| 409 | Conflict (duplicate email, not enough stock, invalid order status change) |
| 413 | Request or image too large |
| 422 | Validation failed — `details` lists each field |
| 429 | Too many login/register attempts |

## Authentication

| Method & URL | Auth | Body | Success |
|---|---|---|---|
| `POST /auth/register` | public | `username` (3–30: a–z, 0–9, `_`), `name` (2–80), `email`, `password` (8+ chars, letter + number) | `201` `{ user, token }` |
| `POST /auth/login` | public | `email`, `password` | `200` `{ user, token }` |
| `GET /auth/me` | user | — | `200` `{ user }` |

Errors: register `409` duplicate email or username (`details` names the field), `422` invalid fields; login `401` "Invalid email or password." (same message for unknown email and wrong password).
A `role` sent in the register body is ignored; everyone registers as `customer`.
User shape: `{ id, username, name, email, role, bio, avatarUrl, createdAt }`.

## Categories & products

| Method & URL | Auth | Description |
|---|---|---|
| `GET /categories` | public | `[ { id, name } ]` |
| `GET /products` | public | Query: `search`, `category` (id), `sort` = `newest` \| `price_asc` \| `price_desc` \| `name_asc`, `page` (1+), `limit` (1–48, default 12). Returns products + `meta`. |
| `GET /products/:id` | public | One product. `404` if missing or deleted. |
| `POST /products` | **admin** | `multipart/form-data` or JSON: `name`, `description`, `price`, `stock`, `categoryId`, optional file field `image` (JPEG/PNG/WebP, max 2 MB). `201` product. |
| `PUT /products/:id` | **admin** | Same fields as create. Omit `image` to keep the current one. `200` product. |
| `DELETE /products/:id` | **admin** | Soft delete (hidden from the store and from carts, kept for order history). `204`. |

Product shape: `{ id, name, description, price, stock, inStock, imageUrl, category: { id, name }, createdAt }`.
`imageUrl` is relative to the API origin (e.g. `/assets/products/x.svg`, `/uploads/products/<uuid>.jpg`), or `null`.

## Cart (all require a logged-in user)

The user is taken from the token. A cart can never be addressed by user id.

| Method & URL | Body | Description |
|---|---|---|
| `GET /cart` | — | `{ items, itemCount, total, hasStockIssues }` |
| `POST /cart/items` | `productId`, `quantity` (1–99) | Adds, or increases the quantity if already in the cart. `201` full cart. `409` if it would exceed stock. |
| `PATCH /cart/items/:id` | `quantity` (1–99) | `:id` is the **cart item** id. `200` full cart. `404` if not your item. |
| `DELETE /cart/items/:id` | — | `200` full cart. `404` if not your item. |

Cart item: `{ id, productId, name, imageUrl, unitPrice, quantity, stock, exceedsStock, lineTotal }`.
Prices are always read from the database; any price sent by the client is ignored.

## Orders (customer)

| Method & URL | Body | Description |
|---|---|---|
| `POST /orders` | `fullName`, `phone`, `address`, `city`, `postalCode`, `country`, optional `notes` | Creates an order from the user's cart in one DB transaction (see below). `201` order. `400` empty cart. `409` stock problem: `details.items = [{ productId, name, requested, available }]`. |
| `GET /orders` | query `page`, `limit` | The caller's own orders, newest first. |
| `GET /orders/:id` | — | One order with its items. `404` unless it belongs to the caller (or the caller is an admin). |

Order shape: `{ id, status, total, paymentMethod: "cod", notes, shipping: {...}, itemCount, createdAt, items: [{ id, productId, name, unitPrice, quantity, lineTotal }] }`.
Statuses: `pending → processing → shipped → delivered`, and `pending`/`processing → cancelled`.
Payment is cash on delivery only (no payment gateway).

**What the checkout transaction does:** reads the cart → locks the product rows (`SELECT … FOR UPDATE`) → verifies availability and stock → inserts the order and its items (copying name and price) → decrements stock → empties the cart. If any step fails, everything is rolled back.

## Orders (admin)

| Method & URL | Auth | Description |
|---|---|---|
| `GET /admin/orders` | admin | All orders with customer name/email. Query: `status`, `page`, `limit`. |
| `PATCH /admin/orders/:id/status` | admin | Body `{ "status": "processing" \| "shipped" \| "delivered" \| "cancelled" }`. Invalid transitions return `409`. Cancelling returns the items to stock. |

## Other

| Method & URL | Description |
|---|---|
| `GET /health` | `{ data: { status: "ok" } }` |
| `GET /assets/...` , `GET /uploads/...` | Static images (not under `/api`). |

---

# Task 2 — Mini social media

**Every endpoint below requires a logged-in user** (`Authorization: Bearer <token>`).
The acting user always comes from the token. A `userId`/`authorId` in a request body is never read, so nobody can post, like, comment or follow as someone else.

Image uploads (`image`, `avatar`) accept JPEG, PNG or WebP up to 2 MB, are verified by file signature, and are stored under a random name. `imageUrl` / `avatarUrl` values are relative to the API origin (`/uploads/...`) or `null`.

## Posts

| Method & URL | Who | Description |
|---|---|---|
| `GET /posts` | user | Query: `scope` = `all` (default) \| `following` (people I follow **plus my own posts**), `userId` (only that user's posts), `cursor` (post id; returns older posts), `limit` (1–20, default 10). Response `meta`: `{ limit, nextCursor }` — pass `nextCursor` as `cursor` for the next page; `null` means the end. |
| `POST /posts` | user | `multipart/form-data` or JSON: `content` (1–1000 chars), optional file `image`. `201` post. |
| `GET /posts/:id` | user | One post. `404` if missing. |
| `PUT /posts/:id` | **author only** | `content`, optional new file `image`, optional `removeImage=true`. `403` for anyone else, **including admins**. |
| `DELETE /posts/:id` | author or admin | `204`. Comments and likes are removed with it. `403` otherwise. |

Post shape: `{ id, content, imageUrl, createdAt, updatedAt, author: { id, username, name, avatarUrl }, likeCount, commentCount, likedByMe }`.

## Comments

| Method & URL | Who | Description |
|---|---|---|
| `GET /posts/:id/comments` | user | Oldest first. Query: `cursor`, `limit` (1–50, default 20). `meta.nextCursor` as for posts. |
| `POST /posts/:id/comments` | user | `{ content }` (1–500). `201` `{ comment, commentCount }`. `404` if the post doesn't exist. |
| `PUT /comments/:id` | **author only** | `{ content }`. `200` comment. `403` otherwise. |
| `DELETE /comments/:id` | author or admin | `200` `{ commentCount }`. `403` otherwise. |

Comment shape: `{ id, postId, content, createdAt, updatedAt, author: {...} }`.

## Likes

| Method & URL | Description |
|---|---|
| `POST /posts/:id/like` | Likes the post. Idempotent: liking twice (even simultaneously) still counts once. `200` `{ likeCount, likedByMe }`. |
| `DELETE /posts/:id/like` | Removes my like. Idempotent. `200` `{ likeCount, likedByMe }`. |

## Profiles and follows

| Method & URL | Description |
|---|---|
| `GET /users` | Query: `q` (matches username or name), `page`, `limit` (1–50, default 20). Without `q`: suggestions (people you don't follow, most followed first). Items: `{ id, username, name, bio, avatarUrl, followerCount, isFollowing }`. |
| `GET /users/:id` | Public profile: `{ id, username, name, bio, avatarUrl, joinedAt, stats: { posts, followers, following }, isFollowing, isSelf }`. No email or role. |
| `PUT /users/me` | Edit **my** profile. `multipart/form-data` or JSON: `name` (2–80), `bio` (≤300), optional file `avatar`, optional `removeAvatar=true`. Returns `{ user }` (same shape as `/auth/me`). `username`, `email` and `role` cannot be changed here and are ignored. |
| `GET /users/:id/followers` | Paged (`page`, `limit`). Items: `{ id, username, name, bio, avatarUrl, isFollowing, isSelf }`. |
| `GET /users/:id/following` | Same shape. |
| `POST /users/:id/follow` | Idempotent. `200` `{ following, followerCount }`. `400` if it's yourself, `404` if the user doesn't exist. |
| `DELETE /users/:id/follow` | Idempotent. `200` `{ following, followerCount }`. |
