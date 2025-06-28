import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import { authorization, authentication } from "../../middleware/auth.js";
import * as PS from "./post.service.js";
import * as PV from "./post.validation.js";
import { fileTypes, multerHost, multerLocal } from "../../middleware/multer.js";

const postRouter = Router();

postRouter.post("/", multerHost(fileTypes.image).array("attachments", 5), validation(PV.createPostSchema), authentication, PS.createPost);

export default postRouter;
