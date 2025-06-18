import joi from "joi";
import { genderTypes, roleTypes } from "../../db/models/user.model.js";
import { generalsRules } from "../../utils/index.js";

export const signupSchema = joi
  .object({
    name: joi.string().min(3).max(30).required(),
    email: generalsRules.email.required(),
    password: generalsRules.password.required(),
    cPassword: generalsRules.password.valid(joi.ref("password")).required(),
    phone: joi
      .string()
      .regex(/^01[0125][0-9]{8}$/)
      .required(),
    gender: joi.string().valid(genderTypes.male, genderTypes.female).required(),
    role: joi.string().valid(roleTypes.user, roleTypes.admin),
    file: generalsRules.file.required(),
    // files: joi.array().items(generalsRules.file.required()).required(), // // by using method array in multer
  })
  .required();

export const confirmEmailSchema = joi
  .object({
    email: generalsRules.email.required(),
    code: joi.string().length(6).required(),
  })
  .required();

export const signinSchema = joi
  .object({
    email: generalsRules.email.required(),
    password: generalsRules.password.required(),
  })
  .required();

export const refreshTokenSchema = joi
  .object({
    authorization: joi.string().required(),
  })
  .required();

export const forgotPasswordSchema = joi
  .object({
    email: generalsRules.email.required(),
  })
  .required();

export const resetPasswordSchema = joi
  .object({
    email: generalsRules.email.required(),
    code: joi.string().length(6).required(),
    newPassword: generalsRules.password.required(),
    cPassword: generalsRules.password.valid(joi.ref("newPassword")).required(),
  })
  .required();

export const updateProfileSchema = joi.object({
  name: joi.string().min(3).max(30),
  gender: joi.string().valid(genderTypes.male, genderTypes.female),
  role: joi.string().valid(roleTypes.user, roleTypes.admin),
  file: generalsRules.file,
  // files: joi.object({
  // attachment :joi.array().items(generalsRules.file.required()).required(), // // by using method fields in multer
  // attachments: joi.array().items(generalsRules.file.required()).required(), // // by using method array in multer
  // }).required(),
});

export const shareProfileSchema = joi.object({
  id: generalsRules.id.required(),
});

export const updatePasswordSchema = joi
  .object({
    oldPassword: generalsRules.password.required(),
    newPassword: generalsRules.password.required(),
    cPassword: generalsRules.password.required().valid(joi.ref("newPassword")),
  })
  .required();

export const updateEmailSchema = joi
  .object({
    email: generalsRules.email.required(),
  })
  .required();

export const replaceEmailSchema = joi
  .object({
    oldCode: joi.string().length(5).required(),
    newCode: joi.string().length(5).required(),
  })
  .required();
