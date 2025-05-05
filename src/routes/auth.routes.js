import express from "express";
import {
  login,
  logout,
  signupStep1,
  verifyOTP,
  verifyUsername,
} from "../controllers/auth.controller.js";

const router = express.Router();

// Step 1: Collect Name, Email, Password, Confirm Password
router.post("/signup/step1", signupStep1);

// Step 2: Verify OTP
router.post("/signup/verify-otp", verifyOTP);

// Step 3: Set Username
router.post("/signup/verify-username", verifyUsername);

router.post("/login", login);
router.get("/logout", logout);

export default router;
