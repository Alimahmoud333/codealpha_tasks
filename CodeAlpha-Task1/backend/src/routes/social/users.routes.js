import { Router } from "express";
import * as users from "../../controllers/social/users.controller.js";
import authenticate from "../../middleware/authenticate.js";
import { parseImage, saveImage } from "../../middleware/upload.js";
import validate from "../../middleware/validate.js";
import {
  searchUsersSchema,
  updateProfileSchema,
  userIdSchema,
  userListSchema,
} from "../../validators/social.validators.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(searchUsersSchema), users.search);

// "/me" is declared before "/:id" so it is never mistaken for an id.
router.put("/me", parseImage("avatar"), validate(updateProfileSchema), saveImage("avatars"), users.updateMe);

router.get("/:id", validate(userIdSchema), users.show);
router.get("/:id/followers", validate(userListSchema), users.followers);
router.get("/:id/following", validate(userListSchema), users.following);
router.post("/:id/follow", validate(userIdSchema), users.follow);
router.delete("/:id/follow", validate(userIdSchema), users.unfollow);

export default router;
