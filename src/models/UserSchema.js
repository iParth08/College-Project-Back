import mongoose from "mongoose";

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
    },

    profile: {
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
    },

    forgotPasswordToken: {
      type: String,
      default: null,
    },
    forgotPasswordTokenExpiry: {
      type: Date,
      default: null,
    },

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

    role: {
      type: String,
      enum: ["student", "professor"],
      default: "student",
    },

    isAdmin: {
      type: Boolean,
      default: false,
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
            "treasurer",
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
