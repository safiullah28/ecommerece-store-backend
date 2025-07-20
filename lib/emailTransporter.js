import nodemailer from "nodemailer";

export const emailTransporter = async (toEmail, link) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL, // Your Gmail address
        pass: process.env.SMTP_PASSWORD, // Your Gmail App Password
      },
    });

    const message = {
      from: process.env.SMTP_EMAIL,
      to: toEmail,
      subject: `Reset password link for ${toEmail}`,
      text: `Your reset password link is ${link}`,
    };
    await transporter.sendMail(message);
  } catch (error) {
    console.log("Error in sending email");
  }
};
