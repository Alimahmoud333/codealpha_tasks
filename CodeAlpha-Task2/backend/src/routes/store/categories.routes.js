import { Router } from "express";
import * as products from "../../controllers/store/products.controller.js";

const router = Router();

router.get("/", products.listCategories);

export default router;
