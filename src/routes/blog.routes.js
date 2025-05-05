import express from "express";
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
  getBlogsByAuthor,
  updateBlog,
} from "../controllers/blog.controller.js";
import isAutheticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.get("/get-all", getAllBlogs);
router.get("/delete-blog/:id", isAutheticated, deleteBlog);
router.post("/edit-blog", isAutheticated, updateBlog);
router.get("/get-blog/:id", getBlogById);
router.get("/get-blogs-by-author/:id", getBlogsByAuthor); // Assuming this is the correct route for getting blogs by author
router.post("/create-blog", isAutheticated, createBlog);

export default router;
