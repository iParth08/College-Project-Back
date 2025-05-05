import mongoose from "mongoose";

const ClubJoinSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ClubJoin = mongoose.model("ClubJoin", ClubJoinSchema);
export default ClubJoin;
