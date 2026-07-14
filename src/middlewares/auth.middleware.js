import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const auth = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
      
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized Access",
      });
    }

    const verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!verifiedToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const user = await User.findById(verifiedToken?._id).select(
      "-password -refreshtoken -verifyCode -verifyCodeExpiry -otp -otpExpiry",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default auth;
