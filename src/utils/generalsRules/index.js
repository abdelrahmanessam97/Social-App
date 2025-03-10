import joi from "joi";
import { Types } from "mongoose";

const isValidation = (value, helpers) => {
  let isValid = Types.ObjectId.isValid(value);
  return isValid ? value : helpers.message("id is not valid");
};

export const generalsRules = {
  id: joi.string().custom(isValidation),
  email: joi.string().email({ tlds: { allow: true }, minDomainSegments: 2, maxDomainSegments: 3 }),
  phone: joi.string().regex(/^01[0125][0-9]{8}$/),
  password: joi.string().required(),
  headers: joi.object({
    authorization: joi.string(),
    "content-type": joi.string(),
    "cache-control": joi.string(),
    "user-agent": joi.string(),
    "content-length": joi.string(),
    "postman-token": joi.string(),
    host: joi.string(),
    accept: joi.string(),
    "accept-encoding": joi.string(),
    connection: joi.string(),
  }),
};
