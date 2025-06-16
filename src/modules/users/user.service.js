import { OAuth2Client } from "google-auth-library";
import { providerTypes, roleTypes, userModel } from "../../db/models/index.js";
import { decodedToken, tokenTypes } from "../../middleware/auth.js";
import cloudinary from "../../utils/cloudnary/index.js";
import { Compare, Encrypt, Hash, asyncHandler, eventEmitter, generateToken } from "./../../utils/index.js";

//------------------------------------------ signup ------------------------------------------------
export const signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, gender } = req.body;

  //check if user exist
  if (await userModel.findOne({ email })) {
    return next(new Error("user already exist", { cause: 409 }));
  }

  // check if image exist
  if (!req.file) {
    return next(new Error("image is required", { cause: 400 }));
  }

  const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
    folder: "social-app/users",
    resource_type: "image",
    // public_id: `users/${req.file.originalname}`,
    // use_filename: true,
    // unique_filename: false,
  });

  // const imagePath = [];
  // for (const file of req.files.attachments) {
  //   imagePath.push(file.path);
  // }

  // upload multiple image on cloudinary
  // const arrPaths = [];
  // for (const file of req.files) {
  //   const { secure_url, public_id } = await cloudinary.uploader.upload(file.path);
  //   arrPaths.push({ secure_url, public_id });
  // }

  // hash password
  const hashedPassword = await Hash({ key: password, SALT_ROUNDS: process.env.SALT_ROUNDS });

  // encrypt phone
  const encryptedPhone = await Encrypt({ key: phone, SECRET_KEY: process.env.SECRET_KEY });

  //send email otp
  eventEmitter.emit("sendEmailOtp", { email });

  // create user
  const user = await userModel.create({ name, email, password: hashedPassword, phone: encryptedPhone, gender, image: { secure_url, public_id } });

  return res.status(200).json({ message: "user added successfully", user });
});

//------------------------------------------ confirm Email ------------------------------------------------
export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { code, email } = req.body;

  // get user
  const user = await userModel.findOne({ email, confirmed: false });

  if (await userModel.findOne({ email, confirmed: true })) {
    return next(new Error("user already confirmed", { cause: 409 }));
  }

  // check if user exist
  if (!user) {
    return next(new Error("user not found", { cause: 404 }));
  }

  // check if code is valid
  if (!(await Compare({ key: code, hashedKey: user.otpEmail }))) {
    return next(new Error("code is invalid", { cause: 400 }));
  }

  // update user
  await userModel.updateOne({ email }, { confirmed: true, $unset: { otpEmail: 0 } });

  return res.status(200).json({ message: "email confirmed successfully" });
});

//------------------------------------------ loginWithGmail ------------------------------------------------

export const loginWithGmail = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;

  const client = new OAuth2Client();
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  }

  const { picture, name, email_verified, email } = await verify();

  let user = await userModel.findOne({ email });

  // check if user exist
  if (!user) {
    user = await userModel.create({
      name,
      email,
      confirmed: email_verified,
      provider: "google",
      image: picture,
      provider: providerTypes.google,
    });
  }

  //check if user is google
  if (user.provider != providerTypes.google) {
    return next(new Error("should login by form page", { cause: 404 }));
  }

  // generate token
  const access_token = await generateToken({
    payload: { email, id: user._id },
    SIGNATURE: user.role == roleTypes.user ? process.env.ACCESS_SIGNATURE_USER : process.env.ACCESS_SIGNATURE_ADMIN,
    option: { expiresIn: "1d" },
  });

  // get user
  return res.status(200).json({ message: "signin with google successfully", token: access_token });
});

//------------------------------------------ signin ------------------------------------------------

export const signin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({
    email,
    confirmed: true,
    provider: providerTypes.system,
  });

  // check if user exist
  if (!user) {
    return next(new Error("user not found", { cause: 404 }));
  }

  // check if password is valid
  if (!(await Compare({ key: password, hashedKey: user.password }))) {
    return next(new Error("password is invalid", { cause: 400 }));
  }

  // generate token
  const access_token = await generateToken({
    payload: { email, id: user._id },
    SIGNATURE: user.role == roleTypes.user ? process.env.ACCESS_SIGNATURE_USER : process.env.ACCESS_SIGNATURE_ADMIN,
    option: { expiresIn: "1d" },
  });

  const refresh_token = await generateToken({
    payload: { email, id: user._id },
    SIGNATURE: user.role == roleTypes.user ? process.env.REFRESH_SIGNATURE_USER : process.env.REFRESH_SIGNATURE_ADMIN,
    option: { expiresIn: "1w" },
  });

  // get user
  return res.status(200).json({
    message: "signin successfully",
    token: { access_token, refresh_token },
  });
});

//------------------------------------------ refresh token ------------------------------------------------

export const refreshToken = asyncHandler(async (req, res, next) => {
  const { authorization } = req.body;

  const user = await decodedToken({ authorization, tokenType: tokenTypes.refresh, next });

  // generate token
  const access_token = await generateToken({
    payload: { email: user.email, id: user._id },
    SIGNATURE: user.role == roleTypes.user ? process.env.ACCESS_SIGNATURE_USER : process.env.ACCESS_SIGNATURE_ADMIN,
    option: { expiresIn: "1d" },
  });

  return res.status(200).json({ message: "refresh token successfully", token: { access_token } });
});

//------------------------------------------ forgot password ------------------------------------------------

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // get user

  if (!(await userModel.findOne({ email, isDeleted: false }))) {
    return next(new Error("user not found", { cause: 404 }));
  }

  eventEmitter.emit("forgotPassword", { email });

  return res.status(200).json({ message: "code sent to email successfully" });
});

//------------------------------------------ reset Password ------------------------------------------------

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, code, newPassword } = req.body;

  // get user
  const user = await userModel.findOne({ email, isDeleted: false });

  if (!user) {
    return next(new Error("user not found", { cause: 404 }));
  }

  // check if code is valid
  if (!(await Compare({ key: code, hashedKey: user.otpPassword }))) {
    return next(new Error("code is invalid", { cause: 400 }));
  }

  // hash password
  const hashedPassword = await Hash({
    key: newPassword,
    SALT_ROUNDS: process.env.SALT_ROUNDS,
  });

  // update user
  await userModel.updateOne({ email }, { password: hashedPassword, confirmed: true, $unset: { otpPassword: 0 } });

  return res.status(200).json({ message: "password reset successfully" });
});
//------------------------------------------ update Profile ------------------------------------------------

export const updateProfile = asyncHandler(async (req, res, next) => {
  if (req.body.phone) {
    req.body.phone = await Encrypt({ key: req.body.phone, SALT_ROUNDS: process.env.SALT_ROUNDS });
  }

  if (req.file) {
    await cloudinary.uploader.destroy(req.user.image.public_id);
    // upload image
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
      folder: "social-app/users",
    });

    req.body.image = { secure_url, public_id };
  }
  const user = await userModel.findByIdAndUpdate({ _id: req.user.id }, req.body, { new: true });

  return res.status(200).json({ message: "profile updated successfully", user });
});
//------------------------------------------ update Password ------------------------------------------------

export const updatePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  // check if password is valid
  if (!(await Compare({ key: oldPassword, hashedKey: req.user.password }))) {
    return next(new Error("password is invalid", { cause: 400 }));
  }

  // hash password
  const hashedPassword = await Hash({ key: newPassword, SALT_ROUNDS: process.env.SALT_ROUNDS });

  const user = await userModel.findByIdAndUpdate({ _id: req.user.id }, { password: hashedPassword, changePasswordAt: Date.now() }, { new: true });

  return res.status(200).json({ message: "password updated successfully", user });
});
