import joi from "joi";
import { generalsRules } from "../../utils/index.js";

export const createPostSchema = joi
  .object({
    content: joi.string().min(3).required(),
    files: joi.array().items(generalsRules.file),
  })
  .required();
