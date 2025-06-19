import nodemailer from "nodemailer";

// Setup email transporter using SMTP (e.g., Gmail, or any SMTP provider)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "LOGIN", // explicitly use LOGIN instead of PLAIN
    user: "mysapiens.io@gmail.com",
    pass: "ofldbwzykxrfcgqb",
  },
});

// Function to send OTP email
export const sendOTPEmail = (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "krish.shwetprakash08@gmail.com",
    subject: "🔐 ClubConnect Verification - Your OTP Inside!",
    text: `Your OTP code is: ${otp}. This code will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
        <h2 style="color: #4a90e2;">Welcome to <span style="color: #333;">ClubConnect</span>!</h2>
        <p>We're excited to have you on board. Use the OTP below to verify your email:</p>
        <div style="font-size: 24px; font-weight: bold; color: #222; background: #e2e8f0; padding: 10px 20px; display: inline-block; border-radius: 6px;">
          ${otp}
        </div>
        <p style="margin-top: 20px;">This code is valid for the next 10 minutes.</p>
        <p style="color: #888; font-size: 12px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Error sending OTP email:", err);
    } else {
      console.log("OTP email sent:", info.response);
    }
  });
};

export const sendNotificationEmail = ({
  title,
  heading,
  content,
  type = "general",
}) => {
  let contextMessage = "";

  switch (type) {
    case "event":
      contextMessage =
        "You’ve shown interest in an upcoming event. Here's what you need to know:";
      break;
    case "blog":
      contextMessage =
        "A new blog has been published on ClubConnect. Dive into the latest insights below:";
      break;
    case "ticket":
      contextMessage =
        "Your ticket has been successfully generated. Details below:";
      break;
    default:
      contextMessage = "Here’s an update from ClubConnect:";
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "krish.shwetprakash08@gmail.com",
    subject: `📢 ClubConnect Notification - ${title}`,
    text: `${heading}\n\n${contextMessage}\n\n${content}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; border-radius: 8px;">
        <h2 style="color: #2b6cb0;">${heading}</h2>
        <p style="margin: 10px 0;">${contextMessage}</p>
        <div style="background-color: #edf2f7; padding: 15px 20px; border-radius: 6px; color: #333;">
          ${content}
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #888;">
          This is an automated message from ClubConnect. Please do not reply directly.
        </p>
      </div>
    `,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("❌ Error sending notification email:", err);
    } else {
      console.log("✅ Notification email sent:", info.response);
    }
  });
};
