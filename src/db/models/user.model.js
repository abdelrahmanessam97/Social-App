import mongoose from "mongoose";

export const genderTypes = {
  male: "male",
  female: "female",
};

export const roleTypes = {
  user: "user",
  admin: "admin",
};

export const providerTypes = {
  system: "system",
  google: "google",
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minLength: 3,
      maxLength: 30,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      required: true,
    },
    password: {
      type: String,
      trim: true,
      minLength: 6,
      required: function () {
        return this.provider !== providerTypes.google;
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: Object.values(genderTypes),
      default: genderTypes.male,
    },
    role: {
      type: String,
      enum: Object.values(roleTypes),
      default: roleTypes.user,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    image: String,
    coverImage: [String],
    changePasswordAt: Date,
    otpEmail: String,
    otpPassword: String,
    provider: {
      type: String,
      enum: Object.values(providerTypes),
      default: providerTypes.system,
    },
  },
  { timestamps: true }
);

export const userModel = mongoose.models.User || mongoose.model("User", userSchema);
