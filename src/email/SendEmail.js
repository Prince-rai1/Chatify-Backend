import axios from "axios";
import { verificationEmailTemplate } from "./EmailTemplate.js";

export const sendEmail = async (
  email,
  username,
  otp,
  title,
  description,
  subject
) => {
  try {
    const html = verificationEmailTemplate(
      username,
      otp,
      title,
      description
    );

    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Chatify",
          email: process.env.BREVO_SENDER_EMAIL,
        },

        to: [
          {
            email,
          },
        ],

        subject,

        htmlContent: html,
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
      }
    );

    return {
      success: true,
      message: "Verification email sent successfully",
    };
  } catch (error) {
    console.log(
      error.response?.data || error.message
    );

    return {
      success: false,
      message: "Failed to send verification email",
    };
  }
};