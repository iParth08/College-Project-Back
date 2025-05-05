import nodemailer from "nodemailer";

// Setup email transporter using SMTP (e.g., Gmail, or any SMTP provider)
const transporter = nodemailer.createTransport({
  service: "gmail", // You can use any email service here
  secure: true, // Use TLS
  port: 465, // Port for secure SMTP
  auth: {
    user: process.env.EMAIL_USER, // Email service username
    pass: process.env.EMAIL_PASS, // Email service password
  },
});

// Function to send OTP email
export const sendOTPEmail = (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "shwetprakashcse2021@nsec.ac.in", // Recipient email address
    subject: "ClubConnect | Your OTP Code",
    text: `Your OTP code is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Error sending OTP email:", err);
    } else {
      console.log("OTP email sent:", info.response);
    }
  });
};
