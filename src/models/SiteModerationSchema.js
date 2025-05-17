import mongoose from "mongoose";

const SiteModerationSchema = new mongoose.Schema({
  unverifiedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  clubApplications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Club" }],
  flaggedBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
  //flaggedComments
});

export default mongoose.model("SiteSchema", SiteModerationSchema);
