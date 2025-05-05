const ClubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    profileImage: String,
    coverImage: String,
    category: String,
    tags: [String],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    announcements: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Announcement" },
    ],
    queries: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClubQuery" }],
  },
  { timestamps: true }
);

export default mongoose.model("Club", ClubSchema);
