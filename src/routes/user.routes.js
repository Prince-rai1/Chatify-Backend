import { Router } from "express";
import {
  DeleteAccount,
  getAllUsers,
  getCurrentUser,
  UpdateFullname,
  UpdateProfilePic,
  UpdateUsername,
} from "../controllers/user.controller.js";
import auth from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/get-current-user").get(auth, getCurrentUser);
router.route("/update-fullname").patch(auth, UpdateFullname);
router.route("/update-username").patch(auth, UpdateUsername);
router
  .route("/update-profilepic")
  .patch(auth, upload.single("profilePic"), UpdateProfilePic);
router.route("/delete-account").delete(auth, DeleteAccount);
router.route("/contacts").get(auth, getAllUsers);

export default router;
