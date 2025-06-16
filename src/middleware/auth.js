import { userModel } from "../db/models/user.model.js";
import { verifyToken } from "../utils/index.js";
import { asyncHandler } from "./../utils/error/index.js";

export const tokenTypes = {
  access: "access",
  refresh: "refresh",
};

export const decodedToken = async ({ authorization, tokenType, next }) => {
  const [prefix, token] = authorization?.split(" ") ?? ["", ""];

  // Check if any of the required fields are missing
  if (!prefix || !token) {
    return next(new Error("token not found", { cause: 400 }));
  }

  // Check if prefix is valid
  let ACCESS_SIGNATURE = undefined;
  let REFRESH_SIGNATURE = undefined;

  if (prefix === process.env.PREFIX_TOKEN_USER) {
    ACCESS_SIGNATURE = process.env.ACCESS_SIGNATURE_USER;
    REFRESH_SIGNATURE = process.env.REFRESH_SIGNATURE_USER;
  } else if (prefix === process.env.PREFIX_TOKEN_ADMIN) {
    ACCESS_SIGNATURE = process.env.ACCESS_SIGNATURE_ADMIN;
    REFRESH_SIGNATURE = process.env.REFRESH_SIGNATURE_ADMIN;
  } else {
    return next(new Error("prefix is invalid", { cause: 400 }));
  }

  // verify a token symmetric - synchronous
  const decoded = await verifyToken({ token, SIGNATURE: tokenType === tokenTypes.access ? ACCESS_SIGNATURE : REFRESH_SIGNATURE });

  if (!decoded?.id) {
    return next(new Error("token is invalid", { cause: 400 }));
  }

  // get user
  const user = await userModel.findById(decoded.id);

  if (!user) {
    return next(new Error("user not found", { cause: 400 }));
  }

  // check if user changed password after the token was issued
  if (parseInt(user?.changePasswordAt?.getTime() / 1000) > decoded.iat) {
    return next(new Error("token expired please login again", { cause: 400 }));
  }

  // check if user is deleted
  if (user?.isDeleted) {
    return next(new Error("user is deleted", { cause: 400 }));
  }

  return user;
};

export const authentication = asyncHandler(async (req, res, next) => {
  const { authorization } = req.headers;

  // verify token
  const user = await decodedToken({ authorization, tokenType: tokenTypes.access, next });

  // add user to request
  req.user = user;

  // pass the request to the next middleware
  next();
});

export const authorization = (accessRoles = []) => {
  return asyncHandler((req, res, next) => {
    const { role } = req?.user;

    if (!accessRoles.includes(role)) {
      return next(new Error("you are not authorized", { cause: 400 }));
    }
    next();
  });
};
