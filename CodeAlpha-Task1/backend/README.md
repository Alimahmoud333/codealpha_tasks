# Backend — CodeAlpha Tasks 1 & 2 (E-commerce + Social media API)

Node.js + Express + MySQL (`mysql2`). Full API reference: [API.md](./API.md).

## Requirements
- Node.js 22+
- MySQL 8.0.16+ (or MariaDB 10.2+) running locally

## Setup
```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
```
Edit `.env`: set `DB_USER` / `DB_PASSWORD`, and a long random `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Then:
```bash
npm run db:init             # creates the database + tables
npm run db:seed             # sample products; with SEED_DEMO_PASSWORD set, also sample accounts + social data
npm run dev                 # http://localhost:5000
```
Check it works: open http://localhost:5000/api/products

### Create the administrator
Put these in your **local** `.env` (never commit it), then run the script:
```
ADMIN_NAME=Store Admin
ADMIN_USERNAME=admin
ADMIN_EMAIL=you@yourdomain.com
ADMIN_PASSWORD=<at least 12 characters>
```
```bash
npm run admin:create
```
Remove the password from `.env` afterwards. Registration through the API can never create an admin.

### Sample accounts
If `SEED_DEMO_PASSWORD` is set in `.env`, `npm run db:seed` also creates seven fictional accounts
(for example `demo.customer@example.com`, `ana.rivera@example.com`) with posts, comments, likes and follows.
**They all use the password you put in `SEED_DEMO_PASSWORD`.** Don't use a real password, and don't seed a public server.

### Upgrading a database created before Task 2
Task 2 adds `username`, `bio` and `avatar_url` to `users` plus four tables.
- **Only test data so far?** Run `npm run db:reset` then `npm run db:seed`.
- **Want to keep data?** Run `database/migrations/task2-users-columns.sql` once, then `npm run db:init`.

### Start over
`npm run db:reset` drops and rebuilds the database (all data is lost).

## Tests
Tests use a separate database that is **wiped on every run**.
```bash
cp .env.test.example .env.test    # DB_NAME must end with _test
npm test
```

## How the tables relate
```
users 1──1 carts 1──* cart_items *──1 products *──1 categories
users 1──* orders 1──* order_items *──1 products

users 1──* posts 1──* comments *──1 users
posts *──* users   (post_likes: a user likes a post at most once)
users *──* users   (follows: follower -> following, at most once per pair)
```
- `order_items` copies the product name and price at purchase time, so old orders never change.
- Products are soft-deleted (`is_active = 0`) because orders reference them.

## Decisions worth explaining to your supervisor
| Decision | Why |
|---|---|
| Layers: routes → controllers → services | Routes map URLs, controllers handle HTTP, services hold business rules and SQL. Easy to find things, easy to test. |
| Role is read from MySQL on every request, not from the JWT | Changing or removing a user takes effect immediately; a token can't carry a forged role. |
| User id always comes from `req.user`, never from the body | Prevents one user acting as another (impersonation / IDOR). |
| Other users' orders and cart items return **404** | Doesn't reveal which ids exist. |
| Totals are calculated on the server, in integer cents | The client can't change prices; no floating-point errors. |
| Checkout uses a transaction + `FOR UPDATE` row locks | Two buyers can't both take the last item; failures leave no half-created order. |
| Zod validators strip unknown fields | A client can't send `role`, `status`, `price`… and have them used. |
| Image uploads: size limit, magic-byte check, random filename | The client's filename and MIME type are not trusted; nothing executable can be stored. |
| Likes/follows: composite primary keys + `ON DUPLICATE KEY` | The database itself makes duplicates impossible, even for simultaneous requests; repeating a request is harmless. |
| Counts (likes, comments, followers) are computed, not stored | They can never drift out of sync with the real rows. |
| Cursor pagination for feeds (`id < cursor`) | Nothing is skipped or repeated when new posts arrive, and it stays fast on large tables. |
| Edit = author only; delete = author or admin | Admins can moderate but can't put words in someone's mouth. |
| "No self-follow" is checked in the service, not with a CHECK | MySQL forbids CHECK constraints on columns used by cascading foreign keys. |
| Helmet, CORS limited to `CLIENT_ORIGIN`, 10 KB JSON limit, login rate limit | Standard hardening. |
| Generic 500 message | Stack traces and SQL errors are logged server-side only. |

## Known limitations
- Cart stock checks at "add to cart" time are advisory; **checkout** is the authoritative check.
- Cash on delivery only; no payment gateway or emails.
- The social module requires login to read; there is no public feed. No notifications, direct messages or real-time updates.
- Usernames can't be changed. Deleting a user account isn't exposed in the API.
- Tokens are not revocable before they expire (default 7 days).


