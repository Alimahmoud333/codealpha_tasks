import { Router } from "express";
import * as products from "../../controllers/store/products.controller.js";
import authenticate from "../../middleware/authenticate.js";
import authorize from "../../middleware/authorize.js";
import { parseImage, saveImage } from "../../middleware/upload.js";
import validate from "../../middleware/validate.js";
import { USER_ROLES } from "../../utils/constants.js";
import {
  createProductSchema,
  listProductsSchema,
  productIdSchema,
  updateProductSchema,
} from "../../validators/product.validators.js";

const router = Router();
const adminOnly = [authenticate, authorize(USER_ROLES.ADMIN)];

// Public
router.get("/", validate(listProductsSchema), products.list);
router.get("/:id", validate(productIdSchema), products.show);

// Admin only. Order matters: auth -> parse upload -> validate -> save file -> controller.
router.post("/", ...adminOnly, parseImage("image"), validate(createProductSchema), saveImage("products"), products.create);
router.put("/:id", ...adminOnly, parseImage("image"), validate(updateProductSchema), saveImage("products"), products.update);
router.delete("/:id", ...adminOnly, validate(productIdSchema), products.remove);

export default router;
