-- Only needed if you already created the database with the Task 1 schema and
-- want to keep its data. (Fresh install or `npm run db:reset`: skip this file.)
--
-- Step 1: run THIS file once (MySQL Workbench / phpMyAdmin / mysql client) on your database.
-- Step 2: run `npm run db:init` to create the new social tables.

ALTER TABLE users
  ADD COLUMN username   VARCHAR(30)  NULL AFTER id,
  ADD COLUMN bio        VARCHAR(300) NULL AFTER role,
  ADD COLUMN avatar_url VARCHAR(255) NULL AFTER bio;

-- Give existing accounts a temporary unique username (users can't change it later,
-- so edit these by hand if you care about them).
UPDATE users SET username = CONCAT('user', id) WHERE username IS NULL;

ALTER TABLE users
  MODIFY COLUMN username VARCHAR(30) NOT NULL,
  ADD UNIQUE KEY uq_users_username (username);
