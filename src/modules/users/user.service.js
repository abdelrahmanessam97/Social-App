import { OAuth2Client } from "google-auth-library";
import { providerTypes, roleTypes, userModel } from "../../db/models/index.js";
import { Compare, Encrypt, Hash, asyncHandler, eventEmitter, generateToken, verifyToken } from "./../../utils/index.js";
import cloudinary from "../../utils/cloudnary/index.js";

//------------------------------------------ signup ------------------------------------------------
export const signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, gender } = req.body;

  // //check if user exist
  // if (await userModel.findOne({ email })) {
  //   return next(new Error("user already exist", { cause: 409 }));
  // }

  // check if image exist
  if (!req.file) {
    return next(new Error("image is required", { cause: 400 }));
  }

  const data = await cloudinary.uploader.upload(req.file.path);

  // const imagePath = [];
  // for (const file of req.files.attachments) {
  //   imagePath.push(file.path);
  // }

  // // hash password
  // const hashedPassword = await Hash({ key: password, SALT_ROUNDS: process.env.SALT_ROUNDS });

  // // encrypt phone
  // const encryptedPhone = await Encrypt({ key: phone, SECRET_KEY: process.env.SECRET_KEY });

  // //send email otp
  // eventEmitter.emit("sendEmailOtp", { email });

  // // create user
  // const user = await userModel.create({ name, email, password: hashedPassword, phone: encryptedPhone, gender, coverImage: imagePath, image: req.files.profile_cover[0].path });
  return res.status(200).json({ message: "user added successfully", data });
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
    SIGNATURE: user.role == roleTypes.user ? process.env.SIGNATURE_TOKEN_USER : process.env.SIGNATURE_TOKEN_ADMIN,
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
    SIGNATURE: user.role == roleTypes.user ? process.env.SIGNATURE_TOKEN_USER : process.env.SIGNATURE_TOKEN_ADMIN,
    option: { expiresIn: "1d" },
  });

  const refresh_token = await generateToken({
    payload: { email, id: user._id },
    SIGNATURE: user.role == roleTypes.user ? process.env.SIGNATURE_TOKEN_USER : process.env.SIGNATURE_TOKEN_ADMIN,
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

  const [prefix, token] = authorization?.split(" ") || ["", ""];

  if (!prefix || !token) {
    return next(new Error("token not found", { cause: 400 }));
  }

  // Check if prefix is valid
  let SIGNATURE_TOKEN = undefined;

  if (prefix === process.env.PREFIX_TOKEN_USER) {
    SIGNATURE_TOKEN = process.env.SIGNATURE_TOKEN_USER;
  } else if (prefix === process.env.PREFIX_TOKEN_ADMIN) {
    SIGNATURE_TOKEN = process.env.SIGNATURE_TOKEN_ADMIN;
  } else {
    return next(new Error("prefix is invalid", { cause: 400 }));
  }

  // verify a token symmetric - synchronous
  const decoded = await verifyToken({ token, SIGNATURE: SIGNATURE_TOKEN });

  if (!decoded?.id) {
    return next(new Error("token is invalid", { cause: 400 }));
  }

  // get user
  const user = await userModel.findById(decoded.id);

  if (!user) {
    return next(new Error("user not found", { cause: 400 }));
  }

  // generate token
  const access_token = await generateToken({
    payload: { email: user.email, id: user._id },
    SIGNATURE: user.role == roleTypes.user ? process.env.SIGNATURE_TOKEN_USER : process.env.SIGNATURE_TOKEN_ADMIN,
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
