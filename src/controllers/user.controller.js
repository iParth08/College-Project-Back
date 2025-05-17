import User from "../models/UserSchema.js";
import { streamUpload } from "../utils/cloudinary.js";

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
        // console.log("pic", pictureUrl);
        user.profile.picture = pictureUrl;
      }

      if (files?.resume?.[0]) {
        console.log("got resume");
        const resumeUrl = await streamUpload(
          files.resume[0].buffer,
          "profiles/resumes"
        );
        user.profile.resume = resumeUrl;
        // console.log("pic", resumeUrl);
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

//get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select(
      "-password -__v -createdAt -updatedAt"
    );
    res.status(200).json(users);
  } catch (error) {
    console.error("getAllUsers error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//fetch notification

// fetch clubs of user

//fetch registered Events

//fetch authored blogs
