import { Router } from "express";
import * as orders from "../../controllers/store/orders.controller.js";
import authenticate from "../../middleware/authenticate.js";
import authorize from "../../middleware/authorize.js";
import validate from "../../middleware/validate.js";
import { USER_ROLES } from "../../utils/constants.js";
import {
  adminListOrdersSchema,
  createOrderSchema,
  listOrdersSchema,
  orderIdSchema,
  updateOrderStatusSchema,
} from "../../validators/order.validators.js";

/* Customer routes: /api/orders */
export const orderRouter = Router();

orderRouter.use(authenticate);
orderRouter.post("/", validate(createOrderSchema), orders.create);
orderRouter.get("/", validate(listOrdersSchema), orders.list);
orderRouter.get("/:id", validate(orderIdSchema), orders.show);

/* Admin routes: /api/admin/orders */
export const adminOrderRouter = Router();

adminOrderRouter.use(authenticate, authorize(USER_ROLES.ADMIN));
adminOrderRouter.get("/", validate(adminListOrdersSchema), orders.adminList);
adminOrderRouter.patch("/:id/status", validate(updateOrderStatusSchema), orders.updateStatus);
