export const verificationEmailTemplate = (username, otp, title, description) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Verify Your Email</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.08);">

<tr>
<td style="background:#2563eb;padding:30px;text-align:center;color:white;">
<h1 style="margin:0;font-size:28px;">Chat App</h1>
<p style="margin-top:10px;font-size:15px;opacity:.9;">
${title}
</p>
</td>
</tr>

<tr>
<td style="padding:40px;">

<h2 style="margin-top:0;color:#111827;">
Hi ${username} 👋
</h2>

<p style="color:#4b5563;font-size:16px;line-height:1.7;">
Welcome to <strong>Chat App</strong>.
${description}
</p>

<div style="margin:35px 0;text-align:center;">

<div
style="
display:inline-block;
padding:18px 40px;
background:#eff6ff;
border:2px dashed #2563eb;
border-radius:10px;
font-size:34px;
font-weight:bold;
letter-spacing:10px;
color:#2563eb;
">
${otp}
</div>

</div>

<p style="color:#6b7280;font-size:15px;">
This verification code will expire in
<strong>30 minutes</strong>.
</p>

<p style="color:#6b7280;font-size:15px;">
If you didn't request this account,
you can safely ignore this email.
</p>

<hr style="border:none;border-top:1px solid #e5e7eb;margin:35px 0;">

<p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
This is an automated email, please do not reply.
</p>

</td>
</tr>

<tr>
<td
style="
background:#f9fafb;
padding:20px;
text-align:center;
font-size:13px;
color:#9ca3af;
">
© ${new Date().getFullYear()} Chat App.
All Rights Reserved.
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;
};