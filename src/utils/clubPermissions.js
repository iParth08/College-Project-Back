import Club from "../models/ClubSchema.js";

export const getUserClubRole = async (clubId, userId) => {
  try {
    const club = await Club.findById(clubId).select(
      "members.user members.coreMember members.role applicants.user applicants.status"
    );

    if (!club) {
      return {
        isMember: false,
        isCore: false,
        isPresident: false,
        isApplicant: false,
        applicationStatus: null,
        roleName: null,
      };
    }

    const member = club.members.find((m) => m.user.toString() === userId);

    const applicant = club.applicants.find((a) => a.user.toString() === userId);

    return {
      isMember: !!member,
      isCore: !!member?.coreMember,
      isPresident: member?.role === "President",
      isApplicant: !!applicant,
      applicationStatus: applicant?.status || null,
      roleName: member?.role || null,
    };
  } catch (err) {
    console.error("Error in getUserClubRole:", err);
    return {
      isMember: false,
      isCore: false,
      isPresident: false,
      isApplicant: false,
      applicationStatus: null,
      roleName: null,
    };
  }
};
