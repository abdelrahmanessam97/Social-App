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
    file: joi.object().required(),
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
