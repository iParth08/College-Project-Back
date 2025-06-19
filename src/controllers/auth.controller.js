import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import User from "../models/UserSchema.js";
import { sendNotificationEmail, sendOTPEmail } from "../utils/sendOTPEmail.js";
import jwt from "jsonwebtoken";
import { assignActivityPoints } from "../utils/updateRanks.js";
import { sendNotificationToUser } from "../utils/sendNotification.js";
import { streamUpload } from "../utils/cloudinary.js";

//*REGISTER REGULAR
//Step 1: Fill User Data
export const signupStep1 = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!(name && email && password && confirmPassword)) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Generate OTP
    const otp = randomBytes(3).toString("hex"); // Generate a random 6-digit OTP
    const otpExpires = Date.now() + 15 * 60 * 1000; // OTP expires in 15 minutes

    console.log("opt", otp);

    // Save the user temporarily with OTP and expiration
    const newUser = new User({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      otp,
      otpExpires,
    });
    await newUser.save();

    //todo: Send OTP to the user's email
    sendOTPEmail(email, otp);

    res.status(200).json({ message: "OTP sent to email", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Step 2: Verify OTP
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (Date.now() > user.otpExpires)
      return res.status(400).json({ message: "OTP has expired" });

    user.isVerified = true;
    user.otp = undefined; // Clear the OTP
    user.otpExpires = undefined; // Clear the OTP expiration
    await user.save();
    res
      .status(200)
      .json({ message: "OTP verified, proceed to choose username" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Step 3: Assign and Verify Username
export const verifyUsername = async (req, res) => {
  const { email, username } = req.body;

  if (!email || !username) {
    return res.status(400).json({ message: "Email and username are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ message: "Username already taken" });

    user.username = username;
    await user.save();

    sendNotificationToUser(user._id, {
      type: "system",
      message: "You have been successfully registered",
    });

    const content = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
      <h1 style="color: #333333; text-align: center;">🎉 Registration Successful 🎉</h1>
      <h2 style="color: #4CAF50; text-align: center;">Welcome aboard, <span style="color: #333;">${user.name}</span>!</h2>
      <p style="font-size: 16px; color: #555;">We're excited to have you join our community! Your account has been successfully created. Below are your login credentials:</p>
      
      <table style="width: 100%; font-size: 16px; color: #333; margin-top: 20px;">
        <tr>
          <td style="padding: 8px 0;"><strong>Email:</strong></td>
          <td>${user.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Username:</strong></td>
          <td>${user.username}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Password:</strong></td>
          <td>It's a secret. Never reveal.</td>
        </tr>
      </table>

      <p style="margin-top: 30px; font-size: 16px; color: #555;">Make sure to keep this information safe. If you ever need assistance, feel free to reach out to our support team.</p>
      
      <p style="margin-top: 20px; font-size: 16px; color: #555;">Wishing you an amazing journey ahead with us! 🚀</p>
      
      <p style="margin-top: 30px; font-size: 16px; color: #999; text-align: center;">— The Team</p>
    </div>
  </div>
`;

    sendNotificationEmail({
      title: "🎉 Registration Successful",
      heading: "Congratulations, We have you with us",
      content, // assign the above content
      type: "general",
    });

    res.status(200).json({ message: "Signup complete" });
  } catch (error) {
    console.error("verifyUsername error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//*LOGIN*
//User Login
export const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!(identifier && password)) {
    return res.status(400).json({ message: "Credentials required" });
  }

  try {
    // Find user either by email or username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(400).json({ message: "No user Found" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect Password" });
    }

    // Generate JWT Token
    const jwtToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "3d",
      }
    );

    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      username: user.username,
      profilePic: user.profile.picture,
      bio: user.profile.bio,
      isAdmin: user.admin.isAdmin,
    };

    // Cookies
    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), //3days
      httpOnly: true,
      sameSite: "strict",
    };

    assignActivityPoints(user._id, 5); //each login points

    res.status(200).cookie("token", jwtToken, options).json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//*DONE
//Admin Login
export const adminLogin = async (req, res) => {
  const { identifier, password } = req.body;

  console.log("Admin Log : ", identifier, password);

  if (!(identifier && password)) {
    return res.status(400).json({ message: "Credentials required" });
  }

  try {
    // Find user either by email or username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(404).json({ message: "No user Found" });
    }

    if (!user.admin.isAdmin) {
      return res
        .status(404)
        .json({ message: "This account doen't hold ADMIN previledges." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect Password" });
    }

    // Generate JWT Token
    const jwtToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      username: user.username,
      profilePic: user.profile.picture,
      bio: user.profile.bio,
      isAdmin: user.admin.isAdmin,
    };

    // Cookies
    // const options = {
    //   expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), //3days
    //   httpOnly: true,
    //   sameSite: "strict",
    // };

    // res.status(200).cookie("token", jwtToken, options).json({
    //   message: "Login successful",
    //   user: userData,
    // });
    res.status(200).json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.error("error from admin-login", error);
    res.status(500).json({ message: "Server error" });
  }
};

//*LOGOUT*
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//*REGISTER ALUMINI

// Helper to generate 6-char alphanumeric password
const generatePassword = (length = 8) => {
  let password = "";
  const possibleChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  while (password.length < length) {
    const bytes = randomBytes(length);
    for (let i = 0; i < bytes.length && password.length < length; i++) {
      const index = bytes[i] % possibleChars.length;
      password += possibleChars.charAt(index);
    }
  }

  return password;
};

// Helper to generate username from name
const generateUsername = async (fullName) => {
  let base = fullName.toLowerCase().replace(/\s+/g, "");
  let username = base;
  let count = 1;
  while (await User.findOne({ username })) {
    username = `${base}${count}`;
    count++;
  }
  return username;
};

//*DONE
// Controller to register a new user
export const registerAlumini = async (req, res) => {
  console.log("hitted it");
  try {
    const {
      fullName,
      email,
      department,
      graduationYear,
      currentCompany,
      jobTitle,
      linkedIn,
      bio,
    } = req.body;
    const files = req.files;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Generate username and password
    const username = await generateUsername(fullName);
    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    let resumeUrl = null;

    const uploadToCloud = async () => {
      if (files?.resume?.[0]) {
        resumeUrl = await streamUpload(
          files.resume[0].buffer,
          "profiles/resume"
        );
      }
    };

    await uploadToCloud();

    // Create new user
    const newUser = new User({
      name: fullName,
      email,
      password: hashedPassword,
      username,
      profile: {
        role: "Alumini", // or "Student" based on your logic
        bio: `${bio || ""}${bio ? " " : ""}${
          jobTitle && currentCompany
            ? `Currently working as ${jobTitle} at ${currentCompany}.`
            : jobTitle
            ? `Currently working as ${jobTitle}.`
            : currentCompany
            ? `Currently working at ${currentCompany}.`
            : ""
        }`.trim(),
        department,
        graduationYear,
        linkedin: linkedIn,
        resumeUrl,
        resumeOriginalName: `${fullName}'s Resume`,
      },
    });

    await newUser.save();

    // Optionally: Send welcome email here with the plaintext password
    const content = `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
      <h1 style="color: #333333; text-align: center;">🎉 Registration Successful 🎉</h1>
      <h2 style="color: #4CAF50; text-align: center;">Welcome aboard, <span style="color: #333;">${fullName}</span>!</h2>
      <p style="font-size: 16px; color: #555;">We're excited to have you join our community! Your account has been successfully created. Below are your login credentials:</p>
      
      <table style="width: 100%; font-size: 16px; color: #333; margin-top: 20px;">
        <tr>
          <td style="padding: 8px 0;"><strong>Email:</strong></td>
          <td>${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Username:</strong></td>
          <td>${username}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Password:</strong></td>
          <td>${password}</td>
        </tr>
      </table>

      <p style="margin-top: 30px; font-size: 16px; color: #555;">Make sure to keep this information safe. If you ever need assistance, feel free to reach out to our support team.</p>
      
      <p style="margin-top: 20px; font-size: 16px; color: #555;">Wishing you an amazing journey ahead with us! 🚀</p>
      
      <p style="margin-top: 30px; font-size: 16px; color: #999; text-align: center;">— The Team</p>
    </div>
  </div>`;

    sendNotificationEmail({
      title: "🎉 Registration Successful",
      heading: "Congratulations, We have you with us",
      content, // assign the above content
      type: "general",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        password, // Only return for email/sending, DO NOT store plaintext
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};
