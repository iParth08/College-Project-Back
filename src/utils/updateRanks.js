import User from "../models/UserSchema.js";

export const updateUserRanks = async () => {
  try {
    // Fetch all users sorted by activityPoints in descending order
    const users = await User.find({}, "profile.activityPoints") // Fetch only required field
      .sort({ "profile.activityPoints": -1 });

    // Assign ranks
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const newRank = i + 1;

      // Only update if the rank has changed to reduce DB writes
      if (user.profile.rank !== newRank) {
        user.profile.rank = newRank;
        await user.save();
      }
    }

    console.log("User ranks updated successfully.");
  } catch (err) {
    console.error("Error updating user ranks:", err);
  }
};

export const assignActivityPoints = async (userId, points) => {
  try {
    // Validate input
    if (!userId || typeof points !== "number") {
      return { success: false, message: "Invalid arguments" };
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Update activity points
    user.profile.activityPoints += points;

    // Save user
    await user.save();

    // Optionally, update ranks here if needed
    await updateUserRanks();

    return { success: true, message: "Points assigned successfully" };
  } catch (err) {
    console.error("Error assigning activity points:", err);
    return { success: false, message: "Server error" };
  }
};
