import { Router } from "express";
import * as comments from "../../controllers/social/comments.controller.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import { commentIdSchema, updateCommentSchema } from "../../validators/social.validators.js";

const router = Router();

router.use(authenticate);

router.put("/:id", validate(updateCommentSchema), comments.update);
router.delete("/:id", validate(commentIdSchema), comments.remove);

export default router;
