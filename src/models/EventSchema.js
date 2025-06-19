import mongoose from "mongoose";
const EventSchema = new mongoose.Schema(
  {
    name: String,
    type: {
      type: String,
      enum: ["event", "workshop", "hackathon", "meetup", "conference"],
    },
    tags: [String],
    description: String,
    bannerImage: String,
    date: Date,
    maxParticipants: {
      type: Number,
      default: 100,
    },
    location: {
      venue: String,
      maplink: {
        type: String,
      },
    },
    isOnline: { type: Boolean, default: false },
    createdByClub: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
    registration: {
      isPaid: { type: Boolean, default: false },
      price: { type: Number, default: 0 },
      deadline: Date,
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }],
  },
  { timestamps: true }
);

export default mongoose.model("Event", EventSchema);
