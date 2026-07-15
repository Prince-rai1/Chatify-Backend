import { Router } from "express";
import {
  ForgetPassword,
  RefreshAccessToken,
  ResetPassword,
  SignUp,
  VerificationCode,
  VerifyOtp,
} from "../controllers/auth.controller.js";
import { SignIn } from "../controllers/auth.controller.js";
import { SignOut } from "../controllers/auth.controller.js";
import auth from "../middlewares/auth.middleware.js";
import arcjet from '../middlewares/arcjet.middleware.js'

const router = Router();

router.route("/signup").post(arcjet, SignUp);
router.route("/signin").post(arcjet, SignIn);
router.route("/signout").get(auth, SignOut);
router.route("/verify-code").post(arcjet, VerificationCode);
router.route("/forgot-password").post(arcjet, ForgetPassword);
router.route("/verify-otp").post(arcjet,VerifyOtp);
router.route("/reset-password").post(arcjet,ResetPassword);
router.route("/refresh-token").post(RefreshAccessToken);

export default router;
