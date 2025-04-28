const CommentSchema = new mongoose.Schema(
  {
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog" }, // or event/post
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" }, // for nesting
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("Comment", CommentSchema);
