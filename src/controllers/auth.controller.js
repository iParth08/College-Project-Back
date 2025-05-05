import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import User from "../models/UserSchema.js";
import { sendOTPEmail } from "../utils/sendOTPEmail.js";
import jwt from "jsonwebtoken";

// Step 1: Signup (Collecting Name, Email, Password, Confirm Password)
export const signupStep1 = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  //Check if all fields are available
  if (!(name && email && password && confirmPassword)) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password !== confirmPassword) {
    // Check if passwords match
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

    //todo: Send OTP to the user's email
    // sendOTPEmail(email, otp);

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
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Check if the OTP is valid and not expired
    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (Date.now() > user.otpExpires)
      return res.status(400).json({ message: "OTP has expired" });

    // OTP is valid, proceed to the next step
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

    const jwtToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ message: "Signup complete" });
  } catch (error) {
    console.error("verifyUsername error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//*LOGIN*
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
      isAdmin: user.isAdmin,
    };

    // Cookies
    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), //3days
      httpOnly: true,
      sameSite: "strict",
    };

    res.status(200).cookie("token", jwtToken, options).json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.error(error);
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
