import User from "../models/UserSchema.js";
import cloudinary from "../utils/cloudinary.js";

export const getUserProfile = async (req, res) => {
  const userId = req.user._id; // Assuming you have auth middleware to set req.user
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
  const { bio, studentId, interests } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update text fields
    user.profile.bio = bio || user.profile.bio;
    user.profile.studentId = studentId || user.profile.studentId;
    if (interests) {
      user.profile.interests = Array.isArray(interests)
        ? interests
        : interests.split(",").map((i) => i.trim());
    }
    /*
    // Dummy file handling
    if (req.files?.picture) {
      const result = await cloudinary.uploader
        .upload_stream({ folder: "profiles" }, (error, result) => {
          if (error) throw new Error("Profile picture upload failed");
          user.profile.picture = result.secure_url;
        })
        .end(req.files.picture[0].buffer);
    }

    if (req.files?.idcard) {
      const result = await cloudinary.uploader
        .upload_stream({ folder: "idcards" }, (error, result) => {
          if (error) throw new Error("ID card upload failed");
          user.profile.idcardUrl = result.secure_url;
          user.profile.idcardOriginalName = req.files.idcard[0].originalname;
        })
        .end(req.files.idcard[0].buffer);
    }

    if (req.files?.resume) {
      const result = await cloudinary.uploader
        .upload_stream(
          { folder: "resumes", resource_type: "raw" },
          (error, result) => {
            if (error) throw new Error("Resume upload failed");
            user.profile.resumeUrl = result.secure_url;
            user.profile.resumeOriginalName = req.files.resume[0].originalname;
          }
        )
        .end(req.files.resume[0].buffer);
    }
        */

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
