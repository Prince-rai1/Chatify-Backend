import {z} from "zod"

export const verifyOtpSchema = z.object({
    email : z.email(),
    otp : z.string()
    .length(6, "Otp must be exactly 6 digits")
    .regex(/^\d{6}$/, "Otp must contain only digits"),
})