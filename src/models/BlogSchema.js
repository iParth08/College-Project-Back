import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    media: {
      type: String, // URL of image or video
      default: "",
    },

    content: {
      type: String,
      required: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    clubBadge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null, // Null if not a club-written blog
    },

    tags: [
      {
        type: String,
        enum: ["Internship", "Job", "Guide", "Tech Article", "Story"],
      },
    ],

    authorComment: {
      type: String,
      default: "",
    },

    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],

    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    viewCount: {
      type: Number,
      default: 0,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    isDraft: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Blog", BlogSchema);
