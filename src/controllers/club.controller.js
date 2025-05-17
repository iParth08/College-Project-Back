import Club from "../models/ClubSchema.js";
import User from "../models/UserSchema.js";
import { streamUpload } from "../utils/cloudinary.js";
import { sendNotificationToUser } from "../utils/sendNotification.js";

//Issue with pdf files, rest great.
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

export const getAllValidClubs = async (req, res) => {
  try {
    const clubs = await Club.find({ status: { $ne: "rejected" } });
    if (clubs.length === 0) {
      res.status(404).json({ message: "No Clubs Exists" });
    }
    res.status(200).json(clubs);
  } catch (error) {
    console.error("Get Clubs Error:", error);
    res.status(500).json({ message: "Failed to fetch clubs." });
  }
};

export const getClubById = async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId).populate(
      "clubPresident",
      "name email"
    );

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

export const applyToClub = async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.user._id; // from auth middleware

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    // Check if already applied
    const existingApplicant = club.applicants.find(
      (app) => app.user.toString() === userId.toString()
    );
    if (existingApplicant) {
      return res
        .status(400)
        .json({ message: "You have already applied to this club" });
    }

    // Optionally: also check if already a member (if you store that somewhere)

    // Add applicant
    club.applicants.push({
      user: userId,
      status: "pending",
      applyAt: new Date(),
    });

    await club.save();

    res.status(200).json({ message: "Application submitted successfully" });
  } catch (error) {
    console.error("Error applying to club:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const withdrawApplication = async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.user._id;

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

export const acceptApplicant = async (req, res) => {
  try {
    const { clubId, applicantId } = req.params;
    const userId = req.user._id;

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
      club.members.push(applicantId);
    }

    await club.save();
    res.status(200).json({ message: "Applicant accepted successfully" });
  } catch (error) {
    console.error("Accept error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const rejectApplicant = async (req, res) => {
  try {
    const { clubId, applicantId } = req.params;
    const userId = req.user._id;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    // Only core members can reject
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

    if (applicant.status === "rejected")
      return res.status(400).json({ message: "Applicant is already rejected" });

    // Reject the user
    applicant.status = "rejected";
    await club.save();

    res.status(200).json({ message: "Applicant rejected successfully" });
  } catch (error) {
    console.error("Reject error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const promoteToCoreMember = async (req, res) => {
  try {
    const { clubId, memberId } = req.params;
    const { role } = req.body; // Role to assign

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    const userId = req.user._id;

    // Check if requester is the president
    const requester = club.members.find(
      (m) => m.user.toString() === userId.toString()
    );

    if (!requester || requester.role !== "president") {
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

    await club.save();
    res.status(200).json({ message: "Member promoted to core successfully" });
  } catch (error) {
    console.error("Promote Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const reviewClubApplication = async (req, res) => {
  try {
    const { clubId, status, adminMessage } = req.body;
    const userId = req.user.id; // Authenticated site admin
    // console.log(clubId, status, adminMessage, userId);

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
      club.members.push({
        user: club.clubPresident.id,
        role: "president",
        coreMember: true,
      });
    }

    await club.save();
    return res.status(200).json({ message: `Club ${status} successfully` });
  } catch (error) {
    console.error("Club approval error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//fetch and display clubs in admin pannel
export const getAllClubsOverview = async (req, res) => {
  const userId = req.user.id;

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
        "name description category members clubPresident clubApplication.status createdAt documents"
      );

    const formattedClubs = clubs.map((club, index) => ({
      id: club._id,
      name: club.name,
      president: club.clubPresident?.id?.name || "N/A",
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

//club under review by admins
//club approval by admins
//club rejected by admins
