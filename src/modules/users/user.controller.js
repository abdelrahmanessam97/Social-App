import { Router } from "express";
import { validation } from "./../../middleware/validation.js";
// import { authorization, authentication } from "./../../middleware/auth.js";
import * as US from "./user.service.js";
import * as UV from "./user.validation.js";
import { fileTypes, multerLocal } from "../../middleware/multer.js";

const userRouter = Router();

userRouter.post(
  "/signup",
  multerLocal(fileTypes.image, "user").single("attachment"),
  US.signup
);
userRouter.patch("/confirm-email", validation(UV.confirmEmailSchema), US.confirmEmail);

userRouter.post("/login", validation(UV.signinSchema), US.signin);
userRouter.post("/loginWithGmail", US.loginWithGmail);
userRouter.get("/refresh_token", validation(UV.refreshTokenSchema), US.refreshToken);

userRouter.patch("/forgot_password", validation(UV.forgotPasswordSchema), US.forgotPassword);
userRouter.patch("/reset_password", validation(UV.resetPasswordSchema), US.resetPassword);

export default userRouter;
