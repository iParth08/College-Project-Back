import express from "express";
import isAutheticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";
import {
  acceptApplicant,
  applyToClub,
  createClub,
  createClubQuery,
  getAllClubsOverview,
  getAllValidClubs,
  getClubBlogCards,
  getClubById,
  getClubEventCards,
  getClubMemberDetails,
  getClubQueriesDetails,
  promoteToCoreMember,
  respondToQuery,
  reviewClubApplication,
  withdrawApplication,
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

//status

//users :
router.post("/applyForMembership", applyToClub);
router.post("/withdrawApplication", withdrawApplication);
router.post("/acceptApplicant", acceptApplicant);
router.post("/promoteToCore", promoteToCoreMember);

//Queries
router.post("/:clubId/queries", isAutheticated, createClubQuery);
router.post(
  "/:clubId/queries/:queryId/respond",
  isAutheticated,
  respondToQuery
);

//byPart:
router.get("/events/:clubId", isAutheticated, getClubEventCards);
router.get("/blogs/:clubId", isAutheticated, getClubBlogCards);
router.get("/members/:clubId", isAutheticated, getClubMemberDetails);
router.get("/get-queries/:clubId", isAutheticated, getClubQueriesDetails);

//admin
router.post("/allClubsOverview", getAllClubsOverview);
router.post("/reviewClubApplication", reviewClubApplication);

export default router;
