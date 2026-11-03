-- =====================================================================
-- CodeAlpha full-stack project: database schema (Task 1: E-commerce, Task 2: Social)
-- MySQL 8.0.16+ / MariaDB 10.2+ (CHECK constraints are enforced)
-- The database itself is created by `npm run db:init`.
-- Safe to run more than once (CREATE TABLE IF NOT EXISTS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- users: shared by every module (store and social media)
-- name = display name, username = unique handle (immutable).
-- role is only ever set by the server / admin script, never by clients.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(30)  NOT NULL,
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  bio           VARCHAR(300) NULL,
  avatar_url    VARCHAR(255) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- categories: one category has many products
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- products
-- price is DECIMAL (exact), never FLOAT.
-- is_active = 0 means "deleted" (soft delete) so old orders keep working.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id INT UNSIGNED NOT NULL,
  name        VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  stock       INT UNSIGNED NOT NULL DEFAULT 0,
  image_url   VARCHAR(255) NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_category (category_id),
  KEY idx_products_active_price (is_active, price),
  KEY idx_products_active_created (is_active, created_at),
  KEY idx_products_name (name),
  CONSTRAINT chk_products_price CHECK (price >= 0),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id)
    REFERENCES categories (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- carts: exactly one cart per user (UNIQUE user_id), stored server-side
-- so it follows the user across devices.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carts (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_carts_user (user_id),
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- cart_items: a product appears once per cart (UNIQUE), with a quantity.
-- No price is stored: the price is always read from products.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cart_id    INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity   INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_items_cart_product (cart_id, product_id),
  KEY idx_cart_items_product (product_id),
  CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id)
    REFERENCES carts (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- orders: the delivery address is copied into the order (snapshot), so it
-- never changes later. user_id is RESTRICT: users with orders can't be deleted.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id              INT UNSIGNED NOT NULL,
  status               ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  payment_method       ENUM('cod') NOT NULL DEFAULT 'cod',
  total_amount         DECIMAL(12,2) NOT NULL,
  shipping_full_name   VARCHAR(100) NOT NULL,
  shipping_phone       VARCHAR(20)  NOT NULL,
  shipping_address     VARCHAR(255) NOT NULL,
  shipping_city        VARCHAR(100) NOT NULL,
  shipping_postal_code VARCHAR(20)  NOT NULL,
  shipping_country     VARCHAR(100) NOT NULL,
  notes                VARCHAR(500) NULL,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orders_user_created (user_id, created_at),
  KEY idx_orders_status (status),
  CONSTRAINT chk_orders_total CHECK (total_amount >= 0),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- order_items: product name and unit price are COPIED at purchase time, so
-- history stays correct even if the product is renamed, re-priced or deleted.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id     INT UNSIGNED NOT NULL,
  product_id   INT UNSIGNED NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  unit_price   DECIMAL(10,2) NOT NULL,
  quantity     INT UNSIGNED NOT NULL,
  line_total   DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
    REFERENCES orders (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- TASK 2: MINI SOCIAL MEDIA
-- =====================================================================

-- ---------------------------------------------------------------------
-- posts: deleting a user deletes their posts (CASCADE).
-- Feed pages use "id < cursor", which the primary key serves directly.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  content    VARCHAR(1000) NOT NULL,
  image_url  VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_posts_user_id (user_id, id),
  CONSTRAINT fk_posts_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- comments: removed together with their post or their author.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id    INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  content    VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comments_post (post_id, id),
  KEY idx_comments_user (user_id),
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id)
    REFERENCES posts (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- post_likes: the composite PRIMARY KEY (post_id, user_id) is what makes a
-- duplicate like impossible, even if two requests arrive at the same time.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_likes (
  post_id    INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  KEY idx_post_likes_user (user_id),
  CONSTRAINT fk_post_likes_post FOREIGN KEY (post_id)
    REFERENCES posts (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_post_likes_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- follows: PRIMARY KEY (follower_id, following_id) prevents duplicates.
-- "Nobody follows themselves" is enforced in the service layer, because
-- MySQL does not allow a CHECK on columns used in cascading foreign keys.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS follows (
  follower_id  INT UNSIGNED NOT NULL,
  following_id INT UNSIGNED NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  KEY idx_follows_following (following_id, created_at),
  CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_follows_following FOREIGN KEY (following_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
