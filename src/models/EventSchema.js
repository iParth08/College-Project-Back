const EventSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    bannerImage: String,
    date: Date,
    location: String,
    isOnline: { type: Boolean, default: false },

    createdByClub: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
    registration: {
      isPaid: { type: Boolean, default: false },
      price: { type: Number, default: 0 },
      maxParticipants: Number,
      deadline: Date,
    },

    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }],
  },
  { timestamps: true }
);

export default mongoose.model("Event", EventSchema);
