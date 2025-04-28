const AnnouncementSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    attachments: [String],
    isPinned: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    club: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", AnnouncementSchema);
