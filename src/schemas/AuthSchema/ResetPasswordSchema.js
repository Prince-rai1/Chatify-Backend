import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, "Reset token is required"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(20, "Password cannot exceed 20 characters"),

    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters")
      .max(20, "Confirm password cannot exceed 20 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });