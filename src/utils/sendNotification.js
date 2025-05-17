import User from "../models/UserSchema.js";

export const sendNotificationToUser = async (
  userId,
  { type, message, relatedClub = null, relatedEvent = null }
) => {
  try {
    const notification = {
      type,
      message,
      relatedClub,
      relatedEvent,
      createdAt: new Date(),
      isRead: false,
    };

    await User.findByIdAndUpdate(userId, {
      $push: { notifications: { $each: [notification], $position: 0 } }, // newest first
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};
