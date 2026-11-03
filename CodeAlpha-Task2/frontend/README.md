# Frontend — CodeAlpha Tasks 1 & 2 (Store + Community)

React 19 + Vite + React Router + Axios, styled with plain CSS (no UI framework).
It talks to the Express API in `../backend`.

## Setup
```bash
cd frontend
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm run dev              # http://localhost:5173
```
`VITE_API_ORIGIN` must be the API address (default `http://localhost:5000`).
The backend's `CLIENT_ORIGIN` must be this app's address (default `http://localhost:5173`), otherwise the browser blocks requests (CORS).

`npm run build` creates a production build in `dist/`.

## Pages
| Route | Access | What it does |
|---|---|---|
| `/shop` | public | Product grid: search, category filter, sort, pagination (filters live in the URL) |
| `/shop/products/:id` | public | Details, quantity picker validated against stock, Add to cart |
| `/cart` | login | Change quantities, remove items, server-calculated total |
| `/checkout` | login | Delivery form (validated here and on the server), places the order |
| `/orders/:id/confirmation` | login | Order confirmation |
| `/orders`, `/orders/:id` | login | Your order history and each order's status |
| `/account` | login | Basic account information |
| `/login`, `/register` | visitors | Authentication |
| `/community` | login | Feed (Everyone / Following), post composer with optional image, like, edit, delete, "Load more" |
| `/community/posts/:id` | login | One post with its comments (add, edit, delete) |
| `/community/people` | login | Search people or see suggestions, follow / unfollow |
| `/users/:id` | login | Profile: photo, bio, counts, posts, followers, following; edit your own |
| `/admin/products` | admin | Add, edit (with image upload) and delete products |
| `/admin/orders` | admin | All orders, change status (cancelling restocks) |

## Folder structure
```
src/
  api/axios.js          one configured Axios instance (base URL, token header, error helpers)
  services/             one file per API resource; return plain data
  context/ + reducers/  Auth, Cart and Toast state (Context API + useReducer)
  hooks/                useAuth, useCart, useToast, useDebounce, useApiData, useCursorList (feeds, comments)
  constants/            routes, storage keys, action names, order statuses, app config
  utils/                formatting, form validation, safe localStorage helpers
  routes/               AppRouter + ProtectedRoute / GuestRoute / AdminRoute
  layouts/              MainLayout, AdminLayout
  components/           common/ (Button, Field, Dialog...), navbar/, store/, social/, admin/
  pages/                auth/, ecommerce/, social/, admin/, profile/
  styles/               tokens.css (variables) + base, layout, components, store, admin, auth
```

## Decisions worth explaining
| Decision | Why |
|---|---|
| The cart is stored on the server; `CartContext` only mirrors it | One source of truth; the server calculates every price and total. |
| Every cart change returns the full cart and replaces local state | The UI can never drift from the database. |
| Filters are kept in the URL (`?q=&category=&sort=&page=`) | Links can be shared, and Back/Forward work. |
| `useApiData` ignores outdated responses | A slow earlier search can't overwrite a newer one. |
| JWT in `localStorage` | Simple, survives refresh. Trade-off: readable by injected scripts (XSS). React escapes output by default and the API sends security headers. The alternative is an httpOnly cookie plus CSRF protection. |
| `AdminRoute` only hides pages | The real check is on the API, which returns 403 to non-admins. |
| Task 1 (store) and Task 2 (community) share one login, one `AuthContext` and one Axios instance | The API identifies the user from the token, so social actions can never be done as someone else. |
| Feeds use `useCursorList` ("load more" with a cursor) | New posts arriving meanwhile can't cause skipped or repeated posts. |
| Like: the heart changes instantly, then the server's real count replaces it; it reverts on error | Feels instant but the database stays the source of truth. |
| Post/comment buttons are shown by role, but the API decides | Edit = author only; delete = author or admin. Hiding a button is never the protection. |
| Native `<dialog>`, labelled fields, live-region toasts, skip link | Keyboard and screen-reader support without extra libraries. |
| Product images fall back to a placeholder | A missing or broken image never breaks the layout. |

## Manual test checklist: store (run with the backend running)
1. `/shop` shows the seeded products; search "leather", filter by category, sort by price.
2. Open a product; try quantity above stock (it is capped); add to cart while logged out (redirects to login, then back).
3. Register, add items, change quantities, remove an item; refresh: the cart is still there.
4. Check out with empty fields (errors listed), then with valid details; see the confirmation and the order in "My orders".
5. Log in as admin (see backend README): add, edit and delete a product; update an order's status; cancel one and see stock return.
6. Try `/admin/products` as a customer (redirected) and shrink the window to phone width.

## Manual test checklist: community
Seed sample accounts first (`SEED_DEMO_PASSWORD` in the backend `.env`, then `npm run db:seed`), then log in as `demo.customer@example.com`.
1. `/community` shows posts; switch Everyone / Following; click "Load more" if offered.
2. Write a post (with and without an image). Try an empty post and a post over 1000 characters.
3. Like and unlike a post: the count changes at once and survives a refresh. Like it from a second browser as another user: the count stays accurate.
4. Open a post, add a comment, edit it, delete it. Confirm you can't edit or delete other people's comments or posts (no buttons; the API also refuses).
5. `/community/people`: search "ana", follow her; the Following tab now shows her posts. Unfollow.
6. Open your profile: edit name, bio and photo; the navbar updates immediately. Check the Followers and Following tabs.
7. Log in as the admin: delete someone else's post or comment (allowed), but there is no Edit button on theirs.
