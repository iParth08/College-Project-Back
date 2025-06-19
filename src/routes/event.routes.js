import express from "express";
import upload from "../middlewares/multer.js";
import {
  createEvent,
  getAllEvents,
  getEventById,
  registerForFreeEvent,
  registerForPaidEvent,
  verifyAndGenerateTicket,
} from "../controllers/event.controller.js";
import isAutheticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.post(
  "/create-event",
  upload.fields([{ name: "bannerImage", maxCount: 1 }]),
  createEvent
);

router.get("/eventById/:eventId", isAutheticated, getEventById);
router.get("/get-all-events", isAutheticated, getAllEvents);
router.post("/free-ticket/create", isAutheticated, registerForFreeEvent);
router.post("/paid-ticket/create", isAutheticated, registerForPaidEvent);
router.get(
  "/verify-and-generate-ticket",
  isAutheticated,
  verifyAndGenerateTicket
);

export default router;
