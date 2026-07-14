import  transporter  from "./transporter.js";
import { verificationEmailTemplate } from "./EmailTemplate.js";
// import 

export const sendEmail = async (email, username, otp, title, description, subject) => {
  try {
    const html = verificationEmailTemplate(username, otp, title, description)
    
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: subject,
      html,
    });

    return { success: true, message: "Verification email sent successfully" };
  } catch (error) {
    console.log(error)
    console.log("error while sending email", error.message);
    return { success: false, message: "Failed to send Verification email" };
  }
};
