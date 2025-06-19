import Blog from "../models/BlogSchema.js";
import Event from "../models/EventSchema.js";
import Ticket from "../models/TicketSchema.js";
import User from "../models/UserSchema.js";
import { streamUpload } from "../utils/cloudinary.js";

//*DONE
export const checkUsernameAvailability = async (req, res) => {
  const { username } = req.query;

  try {
    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Username is required." });
    }

    const existingUser = await User.findOne({
      username: username.toLowerCase().replace(/\s+/g, ""),
    });

    return res.json({ available: !existingUser });
  } catch (error) {
    console.error("Error checking username:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//*DONE
export const checkUniqueStudentId = async (req, res) => {
  const { studentId } = req.query;

  try {
    if (!studentId || typeof studentId !== "string") {
      return res.status(400).json({ error: "StudentID is required." });
    }

    const existingUser = await User.findOne({
      "profile.studentId": studentId,
    });

    return res.json({ available: !existingUser });
  } catch (error) {
    console.error("Error checking username:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//*DONE
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.userId; // from auth or param

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const response = {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      isVerified: user.isVerified,
      isAdmin: user.admin?.isAdmin ?? false,
      profile: user.profile,
      admin: {
        isAdmin: user.admin?.isAdmin ?? false,
        role: user.admin?.role ?? null,
        status: user.admin?.status ?? false,
        lastActive: user.admin?.lastActive ?? null,
      },
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//*DONE
//getprofilebyID
export const fetchUserProfileById = async (req, res) => {
  const { userId } = req.params; // or req.query.userId depending on your route

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const user = await User.findById(userId).select(
      "name email username isVerified profile"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("fetchUserProfileById error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//*DONE
export const updateProfile = async (req, res) => {
  const userId = req.user?.id; // Assuming you have auth middleware to set req.user
  const {
    name,
    username,
    bio,
    studentId,
    department,
    graduationYear,
    interests,
    linkedin,
    role,
  } = req.body;

  let interestArr;
  if (interests) interestArr = JSON.parse(interests);

  //get files from multer.
  const files = req.files;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update text fields
    user.name = name || user.name;
    user.username = username || user.username;
    user.profile.department = department || user.profile.department;
    user.profile.graduationYear = graduationYear || user.profile.graduationYear;
    user.profile.linkedin = linkedin || user.profile.linkedin;
    user.profile.bio = bio || user.profile.bio;
    user.profile.studentId = studentId || user.profile.studentId;
    user.profile.role = role || user.profile.role;
    if (interests) {
      user.profile.interests = Array.isArray(interestArr)
        ? interestArr
        : interestArr.split(",").map((i) => i.trim());
    }

    //Upload to cloudinary resolve (pdf error)
    const uploadToCloud = async () => {
      if (files?.profileImage?.[0]) {
        const pictureUrl = await streamUpload(
          files.profileImage[0].buffer,
          "profiles/pictures"
        );
        user.profile.picture = pictureUrl;
      }

      if (files?.resume?.[0]) {
        const resumeUrl = await streamUpload(
          files.resume[0].buffer,
          "profiles/resumes"
        );

        user.profile.resumeUrl = resumeUrl;
        user.profile.resumeOriginalName = `${name}'s Resume`;
      }

      if (files?.idCard?.[0]) {
        const idCardUrl = await streamUpload(
          files.idCard[0].buffer,
          "profiles/idcards"
        );
        user.profile.idcardUrl = idCardUrl;
        user.profile.idcardOriginalName = `${name}'s IDCard`;
      }
    };

    await uploadToCloud();

    await user.save();
    res.status(200).json({ message: "Profile updated", user });
  } catch (error) {
    console.error("updateProfile error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//*DONE
//get all users
export const getAllUsersFormatted = async (req, res) => {
  try {
    const users = await User.find(
      {},
      {
        name: 1,
        email: 1,
        isVerified: 1,
        createdAt: 1,
        "profile.department": 1,
        "profile.picture": 1,
        "profile.idcardUrl": 1,
      }
    );

    const formattedUsers = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      department: user.profile?.department || "N/A",
      status: user.isVerified ? "verified" : "pending",
      joinDate: user.createdAt.toISOString().split("T")[0], // Format: YYYY-MM-DD
      profileImage: user.profile?.picture || "",
      idcardUrl: user.profile?.idcardUrl || "",
    }));

    return res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//*DONE
export const getUserRankAndPoints = async (req, res) => {
  const userId = req.user?.id; // Assuming userId is passed as a URL parameter
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { rank, activityPoints } = user.profile;

    res.json({ rank, activityPoints });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//*DONE
//fetch notification
export const getNotifications = async (req, res) => {
  try {
    // Assuming you have a User model with notifications array
    const userId = req.user?.id;
    const user = await User.findById(userId)
      .populate({
        path: "notifications",
        populate: [
          { path: "relatedClub", model: "Club" },
          { path: "relatedEvent", model: "Event" },
        ],
      })
      .exec();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract relevant notifications in the specified format
    const notifications = user.notifications.map((notification) => ({
      _id: notification._id,
      type: notification.type,
      message: notification.message,
      createdAt: notification.createdAt,
      isRead: notification.isRead,
      relatedClub: notification.relatedClub,
      relatedEvent: notification.relatedEvent,
    }));

    res.status(200).json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Server error" });
  }
};

//*DONE
// fetch clubs of user
export const getUserClubs = async (req, res) => {
  const userId = req.user?.id;

  try {
    const user = await User.findById(userId).populate({
      path: "clubsMember",
      model: "Club",
      populate: {
        path: "announcements.postedBy",
        select: "username", // or name/email
      },
    });

    if (!user) return res.status(404).json({ error: "User not found." });

    const formattedClubs = await Promise.all(
      user.clubsMember.map(async (club) => {
        const member = club.members.find((m) => m.user.toString() === userId);

        return {
          _id: club._id,
          name: club.name,
          description: club.description,
          profileImage: club.profileImage,
          coverImage: club.coverImage,
          tags: club.tags,
          category: club.category,
          clubRating: club.clubRating,
          clubPoints: club.clubPoints,
          memberCount: club.members.length,
          clubApplication: {
            status: club.clubApplication.status,
            adminMessage: club.clubApplication.adminMessage || "",
          },
          announcements: club.announcements.map((a) => ({
            _id: a._id,
            message: a.message,
            postedBy: a.postedBy?.username || "Unknown",
            postedAt: a.postedAt,
          })),
        };
      })
    );

    return res.status(200).json({ clubs: formattedClubs });
  } catch (error) {
    console.error("Error fetching user's clubs:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//*DONE
//fetch registered Events
export const getRegisteredEventsWithTickets = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Step 1: Get user and populate registeredEvents
    const user = await User.findById(userId).populate("registeredEvents");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const eventIds = user.registeredEvents.map((e) => e._id);

    // Step 2: Get all tickets for this user that match the event list
    const tickets = await Ticket.find({
      user: userId,
      event: { $in: eventIds },
    }).populate("event");

    // Step 3: Construct response
    const response = await Promise.all(
      tickets.map(async (ticket) => {
        const event = await Event.findById(ticket.event._id).populate({
          path: "createdByClub",
          select: "name",
        });

        return {
          _id: event._id,
          title: event.name,
          description: event.description,
          date: event.date,
          location: event.location?.venue || "Online",
          organizer: {
            _id: event.createdByClub._id,
            name: event.createdByClub.name,
          },
          image: event.bannerImage,
          registrationStatus: ticket.hasPaid ? "confirmed" : "unpaid",
          ticketNumber: ticket.ticketToken,
        };
      })
    );

    return res.status(200).json({ events: response });
  } catch (error) {
    console.error("Error fetching registered events:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

//*DONE
//fetch Authored Blogs
export const getBlogsByAuthor = async (req, res) => {
  try {
    const authorId = req.params.id;

    const blogs = await Blog.find({ author: authorId })
      .populate("author", "name email")
      .populate("clubBadge", "name");

    if (!blogs || blogs.length === 0) {
      return res
        .status(404)
        .json({ message: "No blogs found for this author" });
    }

    const formattedBlogs = blogs.map((blog) => ({
      _id: blog._id,
      title: blog.title,
      content: blog.content.slice(0, 200) + "...", // truncate preview
      publishedDate: blog.isPublished ? blog.updatedAt || blog.createdAt : null,
      tags: blog.tags || [],
      likes: blog.upvotes?.length || 0,
      comments: blog.comments?.length || 0,
      views: blog.viewCount || 0,
      status: blog.isDraft
        ? "draft"
        : blog.isPublished
        ? "published"
        : "unpublished",
    }));

    res.status(200).json(formattedBlogs);
  } catch (error) {
    console.error("Error fetching blogs by author:", error);
    res.status(500).json({ error: "Server error" });
  }
};
