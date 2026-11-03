import { Router } from "express";
import * as auth from "../controllers/auth.controller.js";
import authenticate from "../middleware/authenticate.js";
import { authLimiter } from "../middleware/rateLimit.js";
import validate from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.validators.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), auth.register);
router.post("/login", authLimiter, validate(loginSchema), auth.login);
router.get("/me", authenticate, auth.me);

export default router;
