import express from "express";
import {
  deleteAccount,
  getAllUsers,
  updateProfile,
} from "../controllers/user.controller.js";
import isAutheticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.get("/get-all", getAllUsers);
router.get("/delete-account", isAutheticated, deleteAccount);

router.post("/update-profile", isAutheticated, updateProfile);

export default router;
