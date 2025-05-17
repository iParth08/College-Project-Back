import express from "express";
import isAutheticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";
import {
  createClub,
  getAllClubsOverview,
  getAllValidClubs,
  getClubById,
  reviewClubApplication,
} from "../controllers/club.controller.js";

const router = express.Router();

router.get("/allValidClubs", getAllValidClubs);
router.get("/clubById/:clubId", getClubById);

router.post(
  "/createClub",
  isAutheticated,
  upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "logo", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
    { name: "activityPlan", maxCount: 1 },
    { name: "budget", maxCount: 1 },
  ]),
  createClub
);

//admin
router.get("/allClubsOverview", isAutheticated, getAllClubsOverview);
router.post("/reviewClubApplication", isAutheticated, reviewClubApplication);

export default router;
