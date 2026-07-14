import { Router } from "express";
import { getChatPartners, getMessages, sendMessage } from "../controllers/message.controller.js";
import auth from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/chats").get(auth, getChatPartners)
router.route("/:id").get(auth, getMessages);
router.route("/send/:id").post(auth, upload.single("image"), sendMessage)


export default router;
