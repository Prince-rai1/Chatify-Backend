import { Router } from "express";
import auth from "../middlewares/auth.middleware.js";
import {
  chatWithAI,
  clearAIChatHistory,
  getAICharacters,
  getAIChatHistory
} from "../controllers/ai.controller.js";

const router = Router();

router.route("/characters").get(auth, getAICharacters);

router.route("/history/:characterId").get(auth, getAIChatHistory);

router.route("/chat").post(auth, chatWithAI);

router.route("/history/:characterId").delete(auth, clearAIChatHistory);

export default router;