import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import User from "../models/UserSchema.js";
import { sendOTPEmail } from "../utils/sendOTPEmail.js";

// Step 1: Signup (Collecting Name, Email, Password, Confirm Password)
export const signupStep1 = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Generate OTP
    const otp = randomBytes(3).toString("hex"); // Generate a random 6-digit OTP
    const otpExpires = Date.now() + 15 * 60 * 1000; // OTP expires in 15 minutes

    // Save the user temporarily with OTP and expiration
    const newUser = new User({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      otp,
      otpExpires,
    });
    await newUser.save();

    // Send OTP to the user's email
    sendOTPEmail(email, otp);

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Step 2: Verify OTP
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Check if the OTP is valid and not expired
    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (Date.now() > user.otpExpires)
      return res.status(400).json({ message: "OTP has expired" });

    // OTP is valid, proceed to the next step
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

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Check if the username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ message: "Username already taken" });

    // Save the username to the user profile
    user.username = username;
    await user.save();

    // User is now fully registered
    res.status(200).json({ message: "Signup complete", username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
