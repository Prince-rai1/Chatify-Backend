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

const router = Router();

router.route("/signup").post(SignUp);
router.route("/signin").post(SignIn);
router.route("/signout").get(auth, SignOut);
router.route("/verify-code").post(VerificationCode);
router.route("/forgot-password").post(ForgetPassword);
router.route("/verify-otp").post(VerifyOtp);
router.route("/reset-password").post(ResetPassword);
router.route("/refresh-token").post(RefreshAccessToken);

export default router;
