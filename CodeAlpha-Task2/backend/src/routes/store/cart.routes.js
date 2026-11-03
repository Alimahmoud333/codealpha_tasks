import { Router } from "express";
import * as cart from "../../controllers/store/cart.controller.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import { addCartItemSchema, cartItemIdSchema, updateCartItemSchema } from "../../validators/cart.validators.js";

const router = Router();

router.use(authenticate);

router.get("/", cart.show);
router.post("/items", validate(addCartItemSchema), cart.addItem);
router.patch("/items/:id", validate(updateCartItemSchema), cart.updateItem);
router.delete("/items/:id", validate(cartItemIdSchema), cart.removeItem);

export default router;
