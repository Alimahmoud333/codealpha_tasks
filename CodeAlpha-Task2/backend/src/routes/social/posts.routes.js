import { Router } from "express";
import * as posts from "../../controllers/social/posts.controller.js";
import authenticate from "../../middleware/authenticate.js";
import { parseImage, saveImage } from "../../middleware/upload.js";
import validate from "../../middleware/validate.js";
import {
  createCommentSchema,
  createPostSchema,
  listCommentsSchema,
  listPostsSchema,
  postIdSchema,
  updatePostSchema,
} from "../../validators/social.validators.js";

const router = Router();

// The whole social module is for logged-in members.
router.use(authenticate);

router.get("/", validate(listPostsSchema), posts.list);
router.post("/", parseImage("image"), validate(createPostSchema), saveImage("posts"), posts.create);
router.get("/:id", validate(postIdSchema), posts.show);
router.put("/:id", parseImage("image"), validate(updatePostSchema), saveImage("posts"), posts.update);
router.delete("/:id", validate(postIdSchema), posts.remove);

router.get("/:id/comments", validate(listCommentsSchema), posts.listComments);
router.post("/:id/comments", validate(createCommentSchema), posts.createComment);

router.post("/:id/like", validate(postIdSchema), posts.like);
router.delete("/:id/like", validate(postIdSchema), posts.unlike);

export default router;
