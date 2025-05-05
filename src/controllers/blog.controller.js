import Blog from "../models/BlogSchema.js";
import User from "../models/UserSchema.js";

// Create a new blog
const createBlog = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user ID found." });
  }

  try {
    const { title, content, authorComment, tags } = req.body;

    const newBlog = new Blog({
      title,
      media: undefined,
      content,
      author: userId,
      authorComment,
      tags,
    });

    const savedBlog = await newBlog.save();

    // Update the user document with the new blog ID
    await User.findByIdAndUpdate(
      userId,
      { $push: { blogs: savedBlog._id } },
      { new: true }
    );

    res
      .status(201)
      .json({ message: "Blog Uploaded Successfully", blog: savedBlog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all blogs
const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().populate("author", "name email"); // Populate author details
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single blog by ID
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "author",
      "name email"
    );
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all blogs written by a author
const getBlogsByAuthor = async (req, res) => {
  try {
    const authorId = req.params.id;
    const blogs = await Blog.find({ author: authorId }).populate(
      "author",
      "name email"
    );
    if (!blogs) {
      return res
        .status(404)
        .json({ message: "No blogs found for this author" });
    }
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a blog by ID
const updateBlog = async (req, res) => {
  try {
    const { title, media, content, author, clubBadge, tags } = req.body;
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, media, content, author, clubBadge, tags },
      { new: true }
    );
    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a blog by ID (optional, if needed)
const deleteBlog = async (req, res) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export {
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogsByAuthor,
  updateBlog,
  deleteBlog,
};
