# CodeAlpha Full-Stack Development Internship

The Project built with **React, Node.js, Express.js and MySQL** for the CodeAlpha Full-Stack Development internship.

| Task   | Project                                        | Folder                                 |
| ------ | ---------------------------------------------- | -------------------------------------- |
| Task 1 | E-commerce Store                               | [`CodeAlpha-Task1`](./CodeAlpha-Task1) |
| Task 2 | Social Media Platform (built on top of Task 1) | [`CodeAlpha-Task2`](./CodeAlpha-Task2) |

Each task folder contains its own `backend/` and `frontend/` folders, and each of those has its own README with detailed instructions.

> **How the tasks relate:** Task 2 reuses the accounts and login system from Task 1 and adds the social features on top. So `CodeAlpha-Task2` is the **complete application** (store + community). `CodeAlpha-Task1` is the store on its own, so each task can be reviewed independently.

---

## Repository structure

```
codealpha_tasks/
├── README.md
├── CodeAlpha-Task1/
│   ├── backend/               Express + MySQL API for the store
│   │   └── README.md
│   └── frontend/              React app for the store
│       └── README.md
└── CodeAlpha-Task2/
    ├── backend/               Express + MySQL API: store + social media
    │   └── README.md
    └── frontend/              React app: store + community
        └── README.md
```

---

## Task 1 — Simple E-commerce Store

- **Products:** responsive product grid with search, category filter, sorting and pagination, plus a detailed product page.
- **Cart:** add, remove and change quantities. The cart is stored on the server per user, and all prices and totals are calculated by the backend.
- **Checkout and orders:** delivery form validated on both sides. Orders are created in a database transaction that checks stock, saves the order and its items, reduces stock and empties the cart. Customers can view their order history and each order's status.
- **Accounts:** registration, login and logout with hashed passwords (bcrypt) and JWT authentication. Protected pages and API routes. A basic account page.
- **Administration:** admins can add, edit and delete products (with image upload), view all orders and change their status. Cancelling an order returns the items to stock.

## Task 2 — Social Media Platform

- **Profiles:** username, display name, bio and profile photo. Users can edit only their own profile. Profiles show posts and follower statistics.
- **Posts:** text posts with an optional image, a feed with "load more" pagination, and edit and delete for the author.
- **Comments:** add, edit and delete comments on any post.
- **Likes:** like and unlike a post. A user can never like the same post twice, and counts are always accurate.
- **Follows:** follow and unfollow users (never yourself, never twice), followers and following lists, a "Following" feed, and a people search with suggestions.
- **Moderation:** admins can delete any post or comment, but cannot edit other people's content.

---

## Technology

| Layer    | Technologies                                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | React 19, Vite, React Router, Axios, Context API + `useReducer`, plain CSS                                                                     |
| Backend  | Node.js 22, Express.js (ES modules), `mysql2`, JWT (`jsonwebtoken`), `bcrypt`, `zod` validation, `multer` uploads, Helmet, CORS, rate limiting |
| Database | MySQL 8.0.16+ or MariaDB 10.2+                                                                                                                 |
| Tooling  | npm, Git and GitHub, Node's built-in test runner with Supertest                                                                                |

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) **22 or newer**
- **MySQL 8.0.16+** or **MariaDB 10.2+** (for example through XAMPP), running locally
- Git

### Run the complete application (Task 2)

**1. Backend**

```bash
cd CodeAlpha-Task2/backend
npm install
copy .env.example .env          # macOS/Linux: cp .env.example .env
```

Open `.env` and set:

```
DB_USER=root
DB_PASSWORD=                     # your MySQL password (empty by default in XAMPP)
DB_NAME=codealpha_task2
JWT_SECRET=                      # a long random string, see below
SEED_DEMO_PASSWORD=              # password for the sample accounts (8+ characters, letter + number)
```

Generate a `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Then create the database, load the sample data and start the API:

```bash
npm run db:init
npm run db:seed
npm run dev                      # http://localhost:5000
```

**2. Frontend** (in a second terminal)

```bash
cd CodeAlpha-Task2/frontend
npm install
copy .env.example .env           # macOS/Linux: cp .env.example .env
npm run dev                      # http://localhost:5173
```

**3. Open** http://localhost:5173

### Run the store only (Task 1)

Use the same steps with the `CodeAlpha-Task1` folders.

> **Use a different `DB_NAME` for each task** (for example `codealpha_task1` and `codealpha_task2`) and **run only one backend and one frontend at a time**. Both use ports 5000 and 5173 by default.
> If you reuse one database for both, run `npm run db:reset` first, because Task 2 adds columns and tables.

### Accounts

| Account                     | How to get it                                                                                                                                                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Customer / community member | Register in the app, or log in as `demo.customer@example.com` after `npm run db:seed` (the password is your `SEED_DEMO_PASSWORD`). The seed also creates six more sample members.                                                                   |
| Administrator               | Admins can **never** be created through registration. Add `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ characters) and optionally `ADMIN_NAME` and `ADMIN_USERNAME` to your local `.env`, run `npm run admin:create`, then remove the password from `.env`. |

No credentials are stored in the source code.

---

## Documentation

| Document                            | Contents                                                            |
| ----------------------------------- | ------------------------------------------------------------------- |
| `CodeAlpha-Task1/backend/README.md` | Setup, database design, security decisions for the store API        |
| `CodeAlpha-Task1/backend/API.md`    | Store endpoints: methods, permissions, request and response formats |
| `CodeAlpha-Task2/backend/README.md` | Setup, database design (all tables), security decisions             |
| `CodeAlpha-Task2/backend/API.md`    | All endpoints, including the social ones                            |
| `*/frontend/README.md`              | Pages, folder structure, design decisions, manual test checklists   |

## Database overview

```
users 1──1 carts 1──* cart_items *──1 products *──1 categories
users 1──* orders 1──* order_items *──1 products

users 1──* posts 1──* comments *──1 users
posts *──* users    (post_likes: one like per user per post)
users *──* users    (follows: one follow per pair of users)
```

Money is stored as `DECIMAL`, purchased prices are copied into `order_items`, and the composite primary keys on `post_likes` and `follows` make duplicates impossible.

## Security notes

- Passwords are hashed with bcrypt and never returned by the API.
- JWT authentication. The user's role is read from the database on every request, never from the token.
- Every protected route is checked on the **server**. Hiding buttons in the interface is never the only protection.
- The acting user always comes from the token, so nobody can post, like, comment, follow or order as someone else. Other users' orders and cart items return `404`.
- All SQL uses parameterized queries. Input is validated with `zod`. Prices and totals are never taken from the client.
- Image uploads are limited to 2 MB, checked by file signature (JPEG, PNG, WebP only) and stored under random names.
- Helmet security headers, CORS limited to the frontend origin, request size limits, and rate limiting on login and registration.
- **Token storage:** the JWT is kept in `localStorage`. That keeps the project simple, but a script injected by an XSS bug could read it. An httpOnly cookie with CSRF protection is the more hardened alternative.

## Testing

Backend tests cover authentication, authorization (ownership rules, IDOR), stock handling at checkout (including two simultaneous buyers), duplicate likes and follows, and upload validation. They use a **separate database that is wiped on every run**:

```bash
cd CodeAlpha-Task2/backend
copy .env.test.example .env.test   # DB_NAME must end with _test
npm test
```

The frontend has a manual test checklist in each `frontend/README.md`.

## Known limitations

- Payment is cash on delivery only; there is no payment gateway and no email.
- The community requires login; there is no public feed. There are no notifications, direct messages or real-time updates.
- Usernames cannot be changed, and deleting an account is not exposed in the interface.
- Cart stock checks are advisory; the **checkout** is the authoritative stock check.
- Tokens cannot be revoked before they expire (7 days by default).
- Product images in the sample data are generated placeholders. Admins can upload real images.

## Author

**Ali Mahmoud** — CodeAlpha Full-Stack Development Intern
