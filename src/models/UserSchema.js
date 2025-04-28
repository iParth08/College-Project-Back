import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
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

    forgotPasswordToken: {
      type: String,
      default: null,
    },
    forgotPasswordTokenExpiry: {
      type: Date,
      default: null,
    },
    verifyEmailToken: {
      type: String,
      default: null,
    },
    verifyEmailTokenExpiry: {
      type: Date,
      default: null,
    },

    profileImage: {
      type: String,
      default: "",
    },

    universityRoll: {
      type: String,
      unique: true,
    },

    studentId: {
      type: String,
      unique: true,
    },

    role: {
      type: String,
      enum: ["student", "professor"],
      default: "student",
    },

    activityPoints: {
      type: Number,
      default: 0,
    },

    clubs: [
      {
        club: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
        role: {
          type: String,
          enum: [
            "member",
            "core-member",
            "ambassador",
            "vice-president",
            "president",
          ],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],

    registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],

    bookmarkedBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
