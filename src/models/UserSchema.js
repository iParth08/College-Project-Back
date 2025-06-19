import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["club", "event", "admin", "system", "warning", "verification"],
    required: true,
  },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  relatedClub: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
  relatedEvent: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
});

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    username: {
      type: String,
      unique: true,
      lowercase: true,
      set: (v) => v.toLowerCase().replace(/\s+/g, ""),
    },

    profile: {
      role: {
        type: String,
        enum: ["Professor", "Alumini", "Student"],
        default: "Student",
      },
      picture: {
        type: String,
        default: "",
      },
      bio: {
        type: String,
        default: "",
      },
      studentId: {
        type: String,
        default: "",
      },
      department: {
        type: String,
        default: "",
      },
      graduationYear: {
        type: String,
        default: "",
      },
      interests: {
        type: [String],
        default: [],
      },
      idcardUrl: {
        type: String,
        default: "",
      },
      idcardOriginalName: {
        type: String,
        default: "",
      },
      resumeUrl: {
        type: String,
        default: "",
      },
      resumeOriginalName: {
        type: String,
        default: "",
      },
      linkedin: {
        type: String,
        default: "",
      },
      activityPoints: {
        type: Number,
        default: 0,
      },
      rank: {
        type: Number,
        default: null,
      },
    },

    notifications: [NotificationSchema],

    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },

    jwtToken: {
      type: String,
      default: null,
    },

    admin: {
      isAdmin: { type: Boolean, default: false },
      role: { type: String, enum: ["Super Admin", "Admin", "Moderator"] },
      status: { type: Boolean, default: false },
      lastActive: { type: Date, default: Date.now },
    },

    clubsMember: [{ type: mongoose.Schema.Types.ObjectId, ref: "Club" }],

    blogsAuthored: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],

    registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],

    bookmarkedBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
