import { z } from "zod";

export const verifyCodeSchema = z.object({
  identifier: z.string(),
  verifyCode: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain only digits"),
});
