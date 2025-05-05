import User from "../models/UserSchema.js";
import { streamUpload } from "../utils/cloudinary.js";

export const getUserProfile = async (req, res) => {
  const userId = req.user?.id; // Assuming you have auth middleware to set req.user
  try {
    const user = await User.findById(userId).select(
      "-password -__v -createdAt -updatedAt"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error("getUserProfile error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
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

// export const getUserProfile = async (req, res) => {}

export const updateProfile = async (req, res) => {
  const userId = req.user?.id; // Assuming you have auth middleware to set req.user
  const { name, bio, studentId, interests } = req.body;
  let interestsArray = JSON.parse(interests);

  //get files from multer.
  const files = req.files;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update text fields
    user.name = name || user.name;
    user.profile.bio = bio || user.profile.bio;
    user.profile.studentId = studentId || user.profile.studentId;
    if (interestsArray) {
      user.profile.interests = Array.isArray(interestsArray)
        ? interestsArray
        : interestsArray.split(",").map((i) => i.trim());
    }

    //Upload to cloudinary

    const uploadToCloud = async () => {
      if (files?.picture?.[0]) {
        const pictureUrl = await streamUpload(
          files.picture[0].buffer,
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

      if (files?.studentIdCard?.[0]) {
        const idCardUrl = await streamUpload(
          files.studentIdCard[0].buffer,
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
