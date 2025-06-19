import express from "express";
import {
  adminLogin,
  login,
  logout,
  registerAlumini,
  signupStep1,
  verifyOTP,
  verifyUsername,
} from "../controllers/auth.controller.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

// Step 1: Collect Name, Email, Password, Confirm Password
router.post("/signup/step1", signupStep1);

// Step 2: Verify OTP
router.post("/signup/verify-otp", verifyOTP);

// Step 3: Set Username
router.post("/signup/verify-username", verifyUsername);

//user login
router.post("/login", login);
router.get("/logout", logout);

router.post("/admin-login", adminLogin);
router.post(
  "/register-alumini",
  upload.fields([{ name: "resume", maxCount: 1 }]),
  registerAlumini
);
export default router;
