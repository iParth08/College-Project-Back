import Club from "../models/ClubSchema.js";
import User from "../models/UserSchema.js";
import { streamUpload } from "../utils/cloudinary.js";
import { sendNotificationToUser } from "../utils/sendNotification.js";
import { getUserClubRole } from "../utils/clubPermissions.js";

//*Issue with pdf files, rest great.
export const createClub = async (req, res) => {
  try {
    const { clubName, category, description, presidentMessage } = req.body;

    const userId = req.user?.id; // assuming you attach user to req after auth middleware

    //get files from multer.
    const files = req.files;

    if (!clubName || !userId) {
      return res
        .status(400)
        .json({ message: "Name and user ID are required." });
    }

    const existing = await Club.findOne({ clubName });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Club with this name already exists." });
    }

    let profileUri = "/"; // default fallback
    let coverImageUri = "/"; // default fallback
    let clubCertificateUri = "/"; // default fallback
    let clubActivityUri = "/"; // default fallback
    let clubBudgetUri = "/"; // default fallback

    //check if files got perfectly here
    console.log("Activity Plan File:", files?.activityPlan?.[0]);
    //upload to cloud
    const [
      uploadedProfile,
      uploadedCover,
      uploadedCertificate,
      uploadedActivity,
      uploadedBudget,
    ] = await Promise.all([
      files?.logo?.[0]
        ? streamUpload(files.logo[0].buffer, "clubs/logo")
        : null,
      files?.banner?.[0]
        ? streamUpload(files.banner[0].buffer, "clubs/banner")
        : null,
      files?.certificate?.[0]
        ? streamUpload(files.certificate[0].buffer, "clubs/certificate")
        : null,
      files?.activityPlan?.[0]
        ? streamUpload(
            files.activityPlan[0].buffer,
            "clubs/activityPlan",
            "raw"`activityPlan-${Date.now()}.pdf`
          )
        : null,
      files?.budget?.[0]
        ? streamUpload(
            files.budget[0].buffer,
            "clubs/budget",
            "raw",
            `budget-${Date.now()}.pdf`
          )
        : null,
    ]);

    if (uploadedProfile) profileUri = uploadedProfile;
    if (uploadedCover) coverImageUri = uploadedCover;
    if (uploadedCertificate) clubCertificateUri = uploadedCertificate;
    if (uploadedActivity) clubActivityUri = uploadedActivity;
    if (uploadedBudget) clubBudgetUri = uploadedBudget;

    const newClub = new Club({
      name: clubName,
      description,
      category,
      clubPresident: {
        id: userId,
        presidentMessage: presidentMessage,
      },
      profileImage: profileUri,
      coverImage: coverImageUri,
      documents: {
        clubCertificate: clubCertificateUri,
        activityPlans: clubActivityUri,
        budgetProposal: clubBudgetUri,
      },
    });

    await newClub.save();
    await User.findByIdAndUpdate(userId, {
      $push: {
        clubsMember: newClub._id, // or use a clubs array with role if preferred
      },
    });

    //push notification for user.
    await sendNotificationToUser(userId, {
      type: "admin",
      message: `You have successfully submitted a club creation application. Proposed Club "${clubName}" will be reviewed shortly. Check updates in you profile. 
      }`,
      relatedClub: newClub._id,
    });

    res.status(200).json({
      message: "Club Application Submitted successfully.",
    });
  } catch (error) {
    console.error("Create Club Error:", error);
    res.status(500).json({ message: "Server error while creating club." });
  }
};

//*DONE
export const getAllValidClubs = async (req, res) => {
  try {
    const clubs = await Club.find({ status: { $ne: "rejected" } }).populate(
      "members",
      "applicants.user"
    );
    if (clubs.length === 0) {
      res.status(404).json({ message: "No Clubs Exists" });
    }

    res.status(200).json(clubs);
  } catch (error) {
    console.error("Get Clubs Error:", error);
    res.status(500).json({ message: "Failed to fetch clubs." });
  }
};

//*DONE
export const getClubById = async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId);

    if (!club) {
      console.log(clubId);
      return res.status(404).json({ message: "Club not found." });
    }

    res.status(200).json(club);
  } catch (error) {
    console.error("Get Club by ID Error:", error);
    res.status(500).json({ message: "Failed to fetch club." });
  }
};
//*done
export const applyToClub = async (req, res) => {
  try {
    const { clubId, userId } = req.body;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const clubWithApplicant = await Club.findOne({
      _id: clubId,
      "applicants.user": userId,
    });

    if (clubWithApplicant) {
      return res.status(409).json({ message: "Already an applicant" });
    }

    // Add applicant
    club.applicants.push({
      user: userId,
      status: "pending",
      applyAt: new Date(),
    });

    await club.save();

    res.status(200).json({ message: "Applied to Club" });
  } catch (error) {
    console.error("Error applying to club:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
//*DONE
export const withdrawApplication = async (req, res) => {
  try {
    const { clubId, userId } = req.body;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    const applicantIndex = club.applicants.findIndex(
      (a) => a.user.toString() === userId.toString()
    );

    if (applicantIndex === -1)
      return res
        .status(400)
        .json({ message: "You have not applied to this club" });

    const status = club.applicants[applicantIndex].status;
    if (status === "accepted")
      return res
        .status(400)
        .json({ message: "Cannot withdraw an accepted application" });

    club.applicants.splice(applicantIndex, 1);
    await club.save();

    res.status(200).json({ message: "Application withdrawn successfully" });
  } catch (error) {
    console.error("Withdraw error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//*DONE
export const acceptApplicant = async (req, res) => {
  try {
    const { clubId, applicantId, userId } = req.body;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    // Only core members can accept
    const isCoreMember = club.members.some(
      (m) => m.user.toString() === userId.toString() && m.coreMember
    );
    if (!isCoreMember) {
      return res
        .status(403)
        .json({ message: "Only core members can perform this action" });
    }

    const applicant = club.applicants.find(
      (a) => a.user.toString() === applicantId.toString()
    );

    if (!applicant)
      return res.status(404).json({ message: "Applicant not found" });

    if (applicant.status === "accepted")
      return res.status(400).json({ message: "Applicant is already accepted" });

    // Accept the user
    applicant.status = "accepted";
    if (!club.members.includes(applicantId)) {
      club.members.push({
        user: applicant.user, // ✅ REQUIRED!
        role: "member",
        coreMember: false,
        individualPoints: 0,
      });
    }

    //remove from applicant list
    club.applicants = club.applicants.filter(
      (a) => a.user.toString() !== applicantId.toString()
    );

    // 🔥 Add club to applicant's User document
    await User.findByIdAndUpdate(applicant.user, {
      $addToSet: { clubsMember: club._id },
    });

    sendNotificationToUser(userId, {
      type: "club",
      message:
        "Congratulations, You have been accepted into the club. Check Club section.",
      relatedClub: clubId,
    });

    await club.save();
    res.status(200).json({ message: "Applicant accepted successfully" });
  } catch (error) {
    console.error("Accept error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//*DONE
export const promoteToCoreMember = async (req, res) => {
  try {
    const { role, clubId, memberId, userId } = req.body; // Role to assign
    console.log(role, clubId, memberId, userId);
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    // Check if requester is the president
    const requester = club.members.find(
      (m) => m.user.toString() === userId.toString()
    );

    if (!requester || requester.role.toLowerCase() !== "president") {
      return res
        .status(403)
        .json({ message: "Only the president can promote members" });
    }

    const member = club.members.find(
      (m) => m.user.toString() === memberId.toString()
    );

    if (!member) {
      return res.status(404).json({ message: "Member not found in this club" });
    }

    // Promote
    member.coreMember = true;
    member.role = role || member.role;

    sendNotificationToUser(userId, {
      type: "club",
      message: `Congratulations, You have been promoted to ${member.role} in the club ${club.name}. Go Check the club.`,
      relatedClub: clubId,
    });
    await club.save();
    res.status(200).json({ message: "Member promoted to core successfully" });
  } catch (error) {
    console.error("Promote Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// BY PART FETCHING :
// Get Event Cards
export const getClubEventCards = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { clubId } = req.params;

    const club = await Club.findById(clubId)
      .select("name coverImage profileImage events")
      .populate({
        path: "events",
        model: "Event",
        select:
          "name bannerImage type date location maxParticipants participants",
        populate: {
          path: "participants",
          model: "Ticket",
          select: "user",
        },
      });

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    const { isMember, isCore, roleName } = userId
      ? await getUserClubRole(clubId, userId)
      : { isMember: false, isCore: false, roleName: null };

    const eventCards = club.events.map((event) => {
      const isUserRegistered = userId
        ? event.participants.some(
            (ticket) => ticket?.user?.toString() === userId
          )
        : false;

      return {
        id: event._id.toString(),
        imageUrl: event.bannerImage,
        title: event.name,
        type: event.type,
        clubName: club.name,
        venue: event.location?.venue || "Online",
        date: event.date.toISOString(),
        participants: event.participants?.length || 0,
        isRegistered: isUserRegistered,
      };
    });

    return res.status(200).json({
      club: {
        name: club.name,
        coverImage: club.coverImage,
        profileImage: club.profileImage,
        isMember,
        isCore,
        roleName,
      },
      events: eventCards,
    });
  } catch (err) {
    console.error("Error fetching club event cards:", err);
    return res.status(500).json({ error: "Failed to fetch club events." });
  }
};

// Get Blog Cards
export const getClubBlogCards = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { clubId } = req.params;

    const club = await Club.findById(clubId)
      .select("name profileImage coverImage blogs")
      .populate({
        path: "blogs",
        model: "Blog",
        match: { isPublished: true }, // Only show published blogs
        select: "title media content tags upvotes viewCount author clubBadge",
        populate: [
          {
            path: "author",
            model: "User",
            select: "name",
          },
          {
            path: "clubBadge",
            model: "Club",
            select: "name",
          },
        ],
      });

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    const { isMember, isCore, roleName } = userId
      ? await getUserClubRole(clubId, userId)
      : { isMember: false, isCore: false, roleName: null };

    const blogCards = club.blogs.map((blog) => ({
      id: blog._id.toString(),
      title: blog.title,
      media: blog.media,
      content: blog.content.slice(0, 300), // You can slice or sanitize if needed
      author: {
        name: blog.author?.name || "Unknown",
      },
      clubBadge: blog.clubBadge
        ? {
            name: blog.clubBadge.name,
          }
        : undefined,
      tags: blog.tags || [],
      upvotes: blog.upvotes?.length || 0,
      viewCount: blog.viewCount || 0,
    }));

    return res.status(200).json({
      club: {
        name: club.name,
        profileImage: club.profileImage,
        coverImage: club.coverImage,
        isMember,
        isCore,
        roleName,
      },
      blogs: blogCards,
    });
  } catch (err) {
    console.error("Error fetching club blog cards:", err);
    return res.status(500).json({ error: "Failed to fetch club blogs." });
  }
};

//get Members details
export const getClubMemberDetails = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { clubId } = req.params;

    const club = await Club.findById(clubId)
      .select("name profileImage coverImage applicants members")
      .populate({
        path: "applicants.user",
        model: "User",
        select:
          "name email profile.picture profile.department profile.graduationYear profile.studentId",
      })
      .populate({
        path: "members.user",
        model: "User",
        select: "name profile.picture",
      });

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    const { isMember, isCore, roleName } = userId
      ? await getUserClubRole(clubId, userId)
      : { isMember: false, isCore: false, roleName: null };

    // Separate members
    const coreMembers = club.members
      .filter((m) => m.coreMember)
      .map((m) => ({
        id: m.user?._id,
        name: m.user?.name || "Unknown",
        picture: m.user?.profile?.picture || "",
        role: m.role,
        clubPoints: m.individualPoints,
      }));

    const generalMembers = club.members
      .filter((m) => !m.coreMember)
      .map((m) => ({
        id: m.user?._id,
        name: m.user?.name || "Unknown",
        picture: m.user?.profile?.picture || "",
        role: m.role,
        clubPoints: m.individualPoints,
      }));

    const applicants = club.applicants.map((a) => ({
      user: a.user,
      status: a.status,
      applyAt: a.applyAt,
    }));

    return res.status(200).json({
      club: {
        name: club.name,
        profileImage: club.profileImage,
        coverImage: club.coverImage,
        isMember,
        isCore,
        roleName,
      },
      applicants,
      coreMembers,
      members: generalMembers,
    });
  } catch (err) {
    console.error("Error fetching club details:", err);
    return res.status(500).json({ error: "Failed to fetch club details." });
  }
};

//!TO BE DONE
export const getClubQueriesDetails = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { clubId } = req.params;

    const club = await Club.findById(clubId)
      .select("name profileImage coverImage queries")
      .populate({
        path: "queries",
        model: "ClubQuery",
        select: "question askedBy responses createdAt updatedAt",
        populate: [
          {
            path: "askedBy",
            model: "User",
            select: "name profileImage",
          },
          {
            path: "responses.responder",
            model: "User",
            select: "name profileImage",
          },
        ],
      });

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    const { isMember, isCore, roleName } = userId
      ? await getUserClubRole(clubId, userId)
      : { isMember: false, isCore: false, roleName: null };

    const transformedQueries = await Promise.all(
      club.queries.map(async (query) => {
        // Get the role of the asker
        const askedByRoleData = await getUserClubRole(clubId, query.askedBy);
        const askedByRole = askedByRoleData.roleName || "Pres";

        // For each response, get responder role
        const transformedResponses = await Promise.all(
          query.responses.map(async (resp) => {
            const roleData = await getUserClubRole(clubId, resp.responder);
            return {
              responder: roleData.roleName || "Member",
              message: resp.message,
              respondedAt: resp.respondedAt,
            };
          })
        );

        return {
          _id: query._id,
          question: query.question,
          askedBy: askedByRole,
          createdAt: query.createdAt,
          updatedAt: query.updatedAt,
          responses: transformedResponses,
        };
      })
    );

    return res.status(200).json({
      club: {
        name: club.name,
        profileImage: club.profileImage,
        coverImage: club.coverImage,
      },
      role: roleName,
      queries: transformedQueries,
    });
  } catch (err) {
    console.error("Error fetching club queries:", err);
    return res.status(500).json({ error: "Failed to fetch club queries." });
  }
};

//create a query
// POST /api/clubs/:clubId/queries
export const createClubQuery = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { question } = req.body;
    const userId = req.user?.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    const isMember = club.members.some((member) => member.user.equals(userId));
    if (!isMember)
      return res.status(403).json({ message: "Only members can ask queries" });

    const newQuery = {
      askedBy: userId,
      question,
      responses: [],
    };

    club.queries.push(newQuery);
    await club.save();

    const savedQuery = club.queries[club.queries.length - 1];

    res
      .status(201)
      .json({ message: "Query posted successfully", query: savedQuery });
  } catch (err) {
    console.error("Error creating query:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//respond to a query
// POST /api/clubs/:clubId/queries/:queryId/respond
export const respondToQuery = async (req, res) => {
  try {
    const { clubId, queryId } = req.params;
    const { message } = req.body;
    const userId = req.user?.id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    const isMember = club.members.some((member) => member.user.equals(userId));
    if (!isMember)
      return res
        .status(403)
        .json({ message: "Only members can respond to queries" });

    const query = club.queries.id(queryId);
    if (!query) return res.status(404).json({ message: "Query not found" });

    query.responses.push({
      responder: userId,
      message,
      respondedAt: new Date(),
    });

    await club.save();

    res.status(200).json({ message: "Response added successfully", query });
  } catch (err) {
    console.error("Error responding to query:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN PANNEL HERE
//fetch and display clubs in admin pannel
export const getAllClubsOverview = async (req, res) => {
  const { userId } = req.body;

  try {
    //check for Authority first
    const user = await User.findById(userId).select("admin");

    if (!user || !user.admin?.isAdmin || !user.admin?.status) {
      return res.status(403).json({
        message:
          "Access denied: You do not have the proper level of authority.",
      });
    }

    const clubs = await Club.find()
      .populate("clubPresident.id", "name email")
      .select(
        "name description category members clubPresident clubApplication.status clubApplication.adminMessage createdAt documents"
      );

    const formattedClubs = clubs.map((club, index) => ({
      id: club._id,
      name: club.name,
      president: club.clubPresident?.id?.name || "N/A",
      adminMessage: club.clubApplication?.adminMessage || "N/A",
      email: club.clubPresident?.id?.email || "N/A",
      members: club.members?.length || 0,
      status: club.clubApplication?.status || "pending",
      submittedDate: club.createdAt.toISOString().split("T")[0],
      description: club.description,
      category: club.category || "General",
      documents: {
        clubCertificate: club.documents?.clubCertificate || "",
        activityPlans: club.documents?.activityPlans || "",
        budgetProposal: club.documents?.budgetProposal || "",
      },
    }));

    return res.status(200).json(formattedClubs);
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return res
      .status(500)
      .json({ message: "Failed to retrieve club overviews." });
  }
};

//club under review ,
//club approval
//club rejected by admins
export const reviewClubApplication = async (req, res) => {
  try {
    const { clubId, status, adminMessage, userId } = req.body;

    if (!["accepted", "review", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status provided" });
    }

    // Check if user is Site Admin
    const user = await User.findById(userId);
    if (!(user.admin.isAdmin && user.admin.status)) {
      return res
        .status(403)
        .json({ message: "Only active site admins can perform this action" });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    // Update status and message
    club.clubApplication.status = status;
    club.clubApplication.adminMessage = adminMessage;

    // If accepted, assign president role to creator
    if (status === "accepted") {
      const isAlreadyMember = club.members.some(
        (member) => String(member.user) === String(club.clubPresident.id)
      );

      if (!isAlreadyMember) {
        club.members.push({
          user: club.clubPresident.id,
          role: "president",
          coreMember: true,
        });
      }
    }

    await club.save();
    return res.status(200).json({ message: `Club ${status} successfully` });
  } catch (error) {
    console.error("Club approval error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
