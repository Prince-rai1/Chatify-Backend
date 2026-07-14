import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { fullNameSchema } from "../schemas/UserSchema/FullNameSchema.js";
import { userNameSchema } from "../schemas/UserSchema/UserNameSchema.js";

export const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const currentUser = await User.findById(userId).select(
    "-password -verifyCode -refreshToken -otp -otpExpiry -verifyCodeExpiry",
  );

  if (!currentUser) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "User fetched successfully!",
    data: currentUser,
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const currentUserId = req.user?._id;

  if (!currentUserId) {
    return res.status(400).json({
      success: false,
      message: "error while fetching all users",
    });
  }

  const users = await User.find({
    _id: { $ne: currentUserId },
  }).select(
    "-password -refreshToken -verifyCode -verifyCodeExpiry -otp -otpExpiry",
  );

  return res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: users,
  });
});

export const UpdateFullname = asyncHandler(async (req, res) => {
  const validation = fullNameSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,

      message: validation.error.issues[0].message,
    });
  }

  const { fullname } = validation.data;

  const userId = req.user?._id;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { fullname: fullname },
    { new: true },
  ).select(
    "-password -refreshToken -verifyCode -verifyCodeExpiry -otp -otpExpiry",
  );

  if (!updatedUser) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Your name update successfully",
    data: updatedUser,
  });
});

export const UpdateUsername = asyncHandler(async (req, res) => {
  const validation = userNameSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.error.issues[0].message,
    });
  }

  const { username } = validation.data;
  const userId = req.user?._id;

  const existingUser = await User.findOne({ username: username });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "This username is already taken. Please try another one.",
    });
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { username: username },
    { new: true },
  ).select("-password");

  return res.status(200).json({
    success: true,
    message: "Username updated successfully!",
    data: updatedUser,
  });
});

export const UpdateProfilePic = asyncHandler(async (req, res) => {
  const localFilePath = req.file?.buffer;

  if (!localFilePath) {
    return res.status(400).json({
      success: false,
      message: "Profile picture file is missing.",
    });
  }

  const userId = req.user?._id;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const oldProfilePicId = user?.profilePicture?.public_id;

  const uploadedImage = await uploadOnCloudinary(
        localFilePath,
        req.file.originalname
    );

  if (!uploadedImage.secure_url) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to upload image." });
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        profilePicture: {
          url: uploadedImage.secure_url,
          public_id: uploadedImage.public_id,
        },
      },
    },
    {
      new: true,
    },
  ).select("-password -refreshtoken -otp -verifyCode -verifyCodeExpiry");

  if (oldProfilePicId) {
    try {
      await deleteFromCloudinary(oldProfilePicId);
    } catch (error) {
      console.error("Failed to delete old profile picture:", error);
    }
  }

  return res.status(200).json({
    success: true,
    message: "Profile picture updated successfully!",
    data: updatedUser,
  });
});

export const DeleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  await User.findByIdAndDelete(userId);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
      success: true,
      message: "Account deleted successfully",
    });
});
