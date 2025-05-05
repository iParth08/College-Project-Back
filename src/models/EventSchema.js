const EventSchema = new mongoose.Schema(
  {
    title: String,
    type: {
      type: String,
      enum: ["event", "workshop", "hackathon", "meetup", "conference"],
    },
    tags: [String],
    description: String,
    bannerImage: String,
    date: Date,
    location: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
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
