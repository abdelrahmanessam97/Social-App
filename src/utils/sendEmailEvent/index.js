import { EventEmitter } from "events";
import { customAlphabet } from "nanoid";
import { userModel } from "../../db/models/index.js";
import { sendEmail } from "../../service/sendEmail.js";
import { Hash } from "../index.js";
import { generateToken } from "../token/generateToken.js";
import { html } from "./../../service/emailTemplate.js";

export const eventEmitter = new EventEmitter();

eventEmitter.on("sendEmail", async (data) => {
  const { email } = data;
  // generate token to confirm email
  const token = await generateToken({
    payload: { email },
    SIGNATURE: process.env.SIGNATURE_TOKEN_EMAIL,
    option: { expiresIn: "3m" },
  });
  // generate link
  const link = `http://localhost:3000/users/confirmEmail/${token}`;
  // send email
  const isEmailSent = await sendEmail(email, "confirm your email", `<a href="${link}">confirm</a>`);

  if (!isEmailSent) {
    return next(new Error("email is not sent", { cause: 400 }));
  }
});

eventEmitter.on("sendEmailOtp", async (data) => {
  const { email, id } = data;

  // confirm email otp
  const otp = customAlphabet("1234567890", 6)();

  // hash otp in database
  const hashedOtp = await Hash({ key: otp, SALT_ROUNDS: process.env.SALT_ROUNDS });
  await userModel.updateOne({ email, _id: id }, { otpEmail: hashedOtp, message: "Confirm your email" });

  // send email
  await sendEmail(email, "confirm your email", html({ otp }));
});

eventEmitter.on("sendNewEmailOtp", async (data) => {
  const { email, id } = data;

  // confirm email otp
  const otp = customAlphabet("1234567890", 6)();

  // hash otp in database
  const hashedOtp = await Hash({ key: otp, SALT_ROUNDS: process.env.SALT_ROUNDS });
  await userModel.updateOne({ tempEmail: email, _id: id }, { otpNewEmail: hashedOtp, message: "Confirm new email" });

  // send email
  await sendEmail(email, "confirm your email", html({ otp }));
});

eventEmitter.on("forgotPassword", async (data) => {
  const { email } = data;

  // confirm email otp
  const otp = customAlphabet("1234567890", 6)();

  // hash otp in database
  const hashedOtp = await Hash({ key: otp, SALT_ROUNDS: process.env.SALT_ROUNDS });
  await userModel.updateOne({ email }, { otpPassword: hashedOtp });

  // send email
  await sendEmail(email, "confirm your email", html({ otp, message: "change your password" }));
});
