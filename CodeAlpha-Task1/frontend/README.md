# Frontend — CodeAlpha Task 1 (E-commerce store)

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
| `/admin/products` | admin | Add, edit (with image upload) and delete products |
| `/admin/orders` | admin | All orders, change status (cancelling restocks) |

## Folder structure
```
src/
  api/axios.js          one configured Axios instance (base URL, token header, error helpers)
  services/             one file per API resource; return plain data
  context/ + reducers/  Auth, Cart and Toast state (Context API + useReducer)
  hooks/                useAuth, useCart, useToast, useDebounce, useApiData (generic loader)
  constants/            routes, storage keys, action names, order statuses, app config
  utils/                formatting, form validation, safe localStorage helpers
  routes/               AppRouter + ProtectedRoute / GuestRoute / AdminRoute
  layouts/              MainLayout, AdminLayout
  components/           common/ (Button, Field, Dialog...), navbar/, store/, admin/
  pages/                auth/, ecommerce/, admin/, profile/
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
| Native `<dialog>`, labelled fields, live-region toasts, skip link | Keyboard and screen-reader support without extra libraries. |
| Product images fall back to a placeholder | A missing or broken image never breaks the layout. |

## Manual test checklist (run with the backend running)
1. `/shop` shows the seeded products; search "leather", filter by category, sort by price.
2. Open a product; try quantity above stock (it is capped); add to cart while logged out (redirects to login, then back).
3. Register, add items, change quantities, remove an item; refresh: the cart is still there.
4. Check out with empty fields (errors listed), then with valid details; see the confirmation and the order in "My orders".
5. Log in as admin (see backend README): add, edit and delete a product; update an order's status; cancel one and see stock return.
6. Try `/admin/products` as a customer (redirected) and shrink the window to phone width.
