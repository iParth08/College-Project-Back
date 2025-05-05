import express from "express";
import {
  deleteAccount,
  fetchUserProfileById,
  getAllUsers,
  getUserProfile,
  updateProfile,
} from "../controllers/user.controller.js";
import isAutheticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.get("/get-all", getAllUsers);
router.get("/delete-account", isAutheticated, deleteAccount);

router.post(
  "/update-profile",
  isAutheticated,
  upload.fields([
    { name: "picture", maxCount: 1 },
    { name: "resume", maxCount: 1 },
    { name: "studentIdCard", maxCount: 1 },
  ]),
  updateProfile
);
router.get("/profileById/:userId", fetchUserProfileById);
router.get("/profile", isAutheticated, getUserProfile);

export default router;
