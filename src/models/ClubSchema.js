import mongoose from "mongoose";

const ClubMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: {
    type: String,
    default: "member",
  },
  coreMember: {
    type: Boolean,
    default: false,
  },
  individualPoints: {
    type: Number,
    default: 0,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const ClubApplicantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["accepted", "pending"],
      default: "pending",
    },
    applyAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ClubQuerySchema = new mongoose.Schema(
  {
    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    responses: [
      {
        responder: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        respondedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const AnnouncementSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const ClubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    profileImage: { type: String, required: true },
    coverImage: { type: String, required: true },
    tags: [String],
    category: String,
    clubRating: { type: Number, default: 3.0 },
    clubPoints: { type: Number, default: 300 },

    clubPresident: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      since: { type: Date, default: Date.now },
      presidentMessage: { type: String },
    },

    clubApplication: {
      status: {
        type: String,
        enum: ["pending", "review", "accepted", "rejected"],
        default: "pending",
      },
      adminMessage: { type: String, default: "" },
    },

    documents: {
      clubCertificate: { type: String, required: true },
      activityPlans: { type: String, default: "" },
      budgetProposal: { type: String, default: "" },
    },

    applicants: [ClubApplicantSchema],

    members: [ClubMemberSchema],

    blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    announcements: [AnnouncementSchema],
    queries: [ClubQuerySchema],
  },
  { timestamps: true }
);

// Virtual to count members
ClubSchema.virtual("memberCount").get(function () {
  return this.members?.length || 0;
});

// Make sure virtuals show up in JSON
ClubSchema.set("toObject", { virtuals: true });
ClubSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Club", ClubSchema);

//?? Club Schema Done
