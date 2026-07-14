import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { lowercase } from "zod";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase:true
    },
    fullname: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase : true
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
    refreshToken: {
      type: String,
      default: "",
    },
    verifyCode: {
      type: String,
    },
    verifyCodeExpiry: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: "",
    },
    otpExpiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    },
  );
};

userSchema.methods.resetToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      hashPassword: this.password,
    },
    process.env.RESET_PASSWORD_SECRET,
    {
      expiresIn: "5m",
    },
  );
};

const User = mongoose.model("User", userSchema);

export default User;
