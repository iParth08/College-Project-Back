import express from "express";
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
} from "../controllers/blog.controller.js";
import isAutheticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.get("/get-all", getAllBlogs);
router.get("/delete-blog/:id", isAutheticated, deleteBlog);
router.post("/edit-blog", isAutheticated, updateBlog);
router.get("/get-blog/:blogId", getBlogById);
router.post(
  "/create-blog",
  isAutheticated,
  upload.fields([{ name: "media", maxCount: 1 }]),
  createBlog
);

export default router;
