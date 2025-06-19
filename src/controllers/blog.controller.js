import Blog from "../models/BlogSchema.js";
import User from "../models/UserSchema.js";
import Club from "../models/ClubSchema.js";
import { streamUpload } from "../utils/cloudinary.js";
import { assignActivityPoints } from "../utils/updateRanks.js";

//* Create a new blog
const createBlog = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user ID found." });
  }

  try {
    const { title, content, authorComment, tags, clubId, isPublished } =
      req.body;
    const parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
    const publish = isPublished === "true" ? true : false;
    const files = req.files;
    let mediaUrl = "";
    if (files?.media?.[0]) {
      mediaUrl = await streamUpload(files.media[0].buffer, "blogs/pictures");
    }
    const newBlog = new Blog({
      title,
      media: mediaUrl,
      content,
      author: userId,
      authorComment,
      clubBadge: clubId || undefined,
      tags: parsedTags,
      isPublished: publish,
      isDraft: !publish,
    });

    assignActivityPoints(userId, 10);
    const savedBlog = await newBlog.save();

    // Update the user document with the new blog ID
    await User.findByIdAndUpdate(
      userId,
      { $push: { blogs: savedBlog._id } },
      { new: true }
    );

    //save to related blog
    if (clubId) {
      await Club.findByIdAndUpdate(
        clubId,
        { $push: { blogs: savedBlog._id } },
        { new: true }
      );
    }

    res
      .status(201)
      .json({ message: "Blog Uploaded Successfully", blog: savedBlog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//*Get all blogs
const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isDraft: false, isPublished: true })
      .populate({ path: "author", select: "name" })
      .populate({ path: "clubBadge", select: "name" });

    const formattedBlogs = blogs.map((blog) => ({
      id: blog._id.toString(),
      title: blog.title,
      media: blog.media || "/default/blog.jpg",
      content: blog.content?.slice(0, 200) + "...", // Optionally shorten preview
      author: {
        name: blog.author?.name || "Unknown",
      },
      clubBadge: blog.clubBadge ? { name: blog.clubBadge.name } : undefined,
      tags: blog.tags,
      upvotes: blog.upvotes?.length || 0,
      viewCount: blog.viewCount || 0,
    }));

    res.json(formattedBlogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ error: error.message });
  }
};

//* Get a single blog by ID
const getBlogById = async (req, res) => {
  const { blogId } = req.params;

  if (!blogId) {
    return res.status(400).json({ message: "Blog ID is required." });
  }

  try {
    const blog = await Blog.findById(blogId)
      .populate({
        path: "author",
        select:
          "name profile.picture profile.bio profile.department profile.graduationYear",
      })
      .populate({
        path: "clubBadge",
        select: "name", // explicitly get the club name
      });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found." });
    }

    const author = blog.author;

    const formattedBlog = {
      id: blog._id.toString(),
      title: blog.title,
      image: blog.media || "/default/blog.jpg",
      content: blog.content,
      author: {
        image: author?.profile?.picture || "/default/profile.jpg",
        name: author?.name || "Unknown Author",
        classBranch: `${author?.profile?.department || "Unknown Dept"} Batch ${
          author?.profile?.graduationYear || "N/A"
        }`,
        club: blog.clubBadge ? blog.clubBadge.name : undefined, // ✅ only if officially posted by a club
        profile: author?.profile?.bio || "",
        comment: blog.authorComment || "",
      },
      tags: blog.tags,
      upvotes: blog.upvotes.length,
    };

    return res.status(200).json(formattedBlog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    return res
      .status(500)
      .json({ message: "Server error while fetching blog." });
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

export { createBlog, getAllBlogs, getBlogById, updateBlog, deleteBlog };
