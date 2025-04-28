const ClubQuerySchema = new mongoose.Schema(
  {
    club: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
    askedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    question: String,
    status: {
      type: String,
      enum: ["pending", "answered", "closed"],
      default: "pending",
    },
    response: {
      responder: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      message: String,
      respondedAt: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ClubQuery", ClubQuerySchema);
