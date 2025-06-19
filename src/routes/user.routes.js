import express from "express";
import {
  checkUniqueStudentId,
  checkUsernameAvailability,
  deleteAccount,
  fetchUserProfileById,
  getAllUsersFormatted,
  getBlogsByAuthor,
  getNotifications,
  getRegisteredEventsWithTickets,
  getUserClubs,
  getUserProfile,
  getUserRankAndPoints,
  updateProfile,
} from "../controllers/user.controller.js";
import isAutheticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.get("/check-username", checkUsernameAvailability);
router.get("/check-studentId", checkUniqueStudentId);
router.get("/get-all-users", getAllUsersFormatted);
router.get("/delete-account", isAutheticated, deleteAccount);

router.post(
  "/update-profile",
  isAutheticated,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "resume", maxCount: 1 },
    { name: "idCard", maxCount: 1 },
  ]),
  updateProfile
);
router.get("/profileById/:userId", fetchUserProfileById);
router.get("/profile", isAutheticated, getUserProfile);
router.get("/get-rank-points", isAutheticated, getUserRankAndPoints);
router.get("/get-blogs-by-author/:id", getBlogsByAuthor);
router.get("/get-clubs", isAutheticated, getUserClubs);
router.get("/get-notifications", isAutheticated, getNotifications);
router.get("/get-reg-events", isAutheticated, getRegisteredEventsWithTickets);

export default router;
