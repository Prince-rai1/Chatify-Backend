import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signUpSchema } from "../schemas/AuthSchema/SignUpSchema.js";
import { signInSchema } from "../schemas/AuthSchema/SignInSchema.js";
import { verifyCodeSchema } from "../schemas/AuthSchema/VerifyCodeSchema.js";
import { sendEmail } from "../email/SendEmail.js";
import { forgetPasswordSchema } from "../schemas/AuthSchema/ForgetPasswordSchema.js";
import { verifyOtpSchema } from "../schemas/AuthSchema/VerifyOtpSchema.js";
import { resetPasswordSchema } from "../schemas/AuthSchema/ResetPasswordSchema.js";

export const SignUp = asyncHandler(async (req, res) => {
  const result = signUpSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error,
    });
  }

  const { username, email, password, fullname } = result.data;

  const isUserExists = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (isUserExists) {
    if (isUserExists.email === email) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    if (isUserExists.username === username) {
      return res.status(400).json({
        success: false,
        message: "Username is already registered",
      });
    }
  }

  const hashPassword = await bcrypt.hash(password, 12);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpExpiry = new Date(Date.now() + 60 * 60 * 1000);

  const newUser = await User.create({
    username: username.toLowerCase(),
    password: hashPassword,
    email: email,
    fullname: fullname,
    verifyCode: otp,
    verifyCodeExpiry: otpExpiry,
  });

  if (!newUser) {
    return res.status(500).json({
      success: false,
      message: "Failed to register the user",
    });
  }

  const emailResponse = await sendEmail(
    email,
    username,
    otp,
    "Verify Your Email",
    "Please use the following OTP to verify your account.",
    "Verify Your Account",
  );

  if (!emailResponse.success) {
    return res
      .status(500)
      .json({ success: false, message: emailResponse.message });
  }

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken -verifyCode -verifyCodeExpiry",
  );

  return res.status(201).json({
    success: true,
    message: "User Registered Successfully",
    data: createdUser,
  });
});

export const SignIn = asyncHandler(async (req, res) => {
  const result = signInSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error,
    });
  }

  const { identifier, password } = result.data;

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User Not found",
    });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    return res.status(401).json({
      success: false,
      message: "Incorrect Password",
    });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email first.",
    });
  }

  const accessToken = await user.generateAccessToken();

  const refreshToken = await user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      ...options,
      maxAge: 24 * 60 * 60 * 1000,
    })
    .cookie("refreshToken", refreshToken, {
      ...options,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      message: "User Signed",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture : user.profilePicture,
        fullname : user.fullname
      },
    });
});

export const SignOut = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      refreshToken: null,
    },
  });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", { ...options })
    .clearCookie("refreshToken", { ...options })
    .json({
      success: true,
      message: "User SignOut successfully",
    });
});

export const VerificationCode = asyncHandler(async (req, res) => {
  const result = verifyCodeSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error,
    });
  }

  const { verifyCode, identifier } = result.data;

  const user = await User.findOne({
    $or : [
      {
        email : identifier
      },
      {
        username : identifier
      }
    ]
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const isCodevalid = user.verifyCode === verifyCode;
  const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();

  if (isCodevalid && isCodeNotExpired) {
    user.isVerified = true;
    user.verifyCode = "000000";
    user.verifyCodeExpiry = new Date("2004-09-09T00:00:00.000Z");

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "User Verifed",
    });
  }

  if (!isCodevalid) {
    return res.status(400).json({
      success: false,
      message: "Invalid Code",
    });
  }

  if (!isCodeNotExpired) {
    return res.status(400).json({
      success: false,
      message: "Code Expired",
    });
  }
});

export const ForgetPassword = asyncHandler(async (req, res) => {
  const result = forgetPasswordSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error,
    });
  }

  const { email } = result.data;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpExpiry = new Date(Date.now() + 30 * 30 * 1000);

  user.otp = otp;
  user.otpExpiry = otpExpiry;

  await user.save({ validateBeforeSave: false });

  const emailResponse = await sendEmail(
    email,
    user.username,
    otp,
    "Reset Your Password",
    "Please use the following OTP to reset your password.",
    "Reset Your Password",
  );

  if (!emailResponse.success) {
    return res
      .status(500)
      .json({ success: false, message: emailResponse.message });
  }

  return res.status(201).json({
    success: true,
    message: "Otp sent",
  });
});

export const VerifyOtp = asyncHandler(async (req, res) => {
  const result = verifyOtpSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error,
    });
  }

  const { email, otp } = result.data;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const isOtpNotExpired = new Date(user.otpExpiry) > new Date();

  const isOtpValid = user.otp === otp;

  if (!isOtpNotExpired) {
    return res.status(400).json({
      success: false,
      message: "Code Expired",
    });
  }

  if (!isOtpValid) {
    return res.status(400).json({
      success: false,
      message: "Invalid otp",
    });
  }

  if (isOtpValid && isOtpNotExpired) {
    user.otp = "000000";
    user.otpExpiry = new Date("2004-09-09T00:00:00.000Z");

    await user.save({ validateBeforeSave: false });
  }

  const resetToken = user.resetToken();

  return res.status(200).json({
    success: true,
    message: "Otp verified",
    data: {
      token: resetToken,
    },
  });
});

export const ResetPassword = asyncHandler(async (req, res) => {
  const result = resetPasswordSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error,
    });
  }

  try {
    const { resetToken, password } = result.data;

    const decoded = jwt.verify(resetToken, process.env.RESET_PASSWORD_TOKEN_SECRET);

    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

     if (decoded.hashPassword !== user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const hashPassword = await bcrypt.hash(password, 12)

    user.password = hashPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired reset token",
    });
  }
});

export const RefreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  try {
    // Verify refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    // Find user
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Check if refresh token matches DB
    if (incomingRefreshToken !== user.refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is expired or already used",
      });
    }

    // Generate new tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save new refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        message: "Access token refreshed successfully",
        accessToken,
        refreshToken,
      });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
});
