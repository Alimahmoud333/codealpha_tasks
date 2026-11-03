import { Router } from "express";
import authRoutes from "./auth.routes.js";
import cartRoutes from "./store/cart.routes.js";
import categoriesRoutes from "./store/categories.routes.js";
import { adminOrderRouter, orderRouter } from "./store/orders.routes.js";
import productsRoutes from "./store/products.routes.js";
import commentsRoutes from "./social/comments.routes.js";
import postsRoutes from "./social/posts.routes.js";
import usersRoutes from "./social/users.routes.js";

const router = Router();

// Shared by every module
router.use("/auth", authRoutes);

// Task 1: E-commerce store
router.use("/categories", categoriesRoutes);
router.use("/products", productsRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRouter);
router.use("/admin/orders", adminOrderRouter);

// Task 2: Mini social media
router.use("/posts", postsRoutes);
router.use("/comments", commentsRoutes);
router.use("/users", usersRoutes);

export default router;
