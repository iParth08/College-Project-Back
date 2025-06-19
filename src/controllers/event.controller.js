import Event from "../models/EventSchema.js";
import Club from "../models/ClubSchema.js";
import User from "../models/UserSchema.js";
import Ticket from "../models/TicketSchema.js";
import crypto from "crypto";
import { streamUpload } from "../utils/cloudinary.js";
import Stripe from "stripe";
import { assignActivityPoints } from "../utils/updateRanks.js";
import { sendNotificationEmail } from "../utils/sendOTPEmail.js";
import { sendNotificationToUser } from "../utils/sendNotification.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//*DONE
export const createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      maxParticipants,
      venue,
      maplink,
      date,
      isPaid,
      price,
      clubId,
      tags,
      deadline,
    } = req.body;
    const files = req.files;

    let bannerImageUrl = "";

    if (files?.bannerImage?.[0]) {
      bannerImageUrl = await streamUpload(
        files.bannerImage[0].buffer,
        "event/banner"
      );
    }

    const parsedTags = tags ? JSON.parse(tags) : [];

    const newEvent = new Event({
      name,
      description,
      type,
      tags: parsedTags,
      date: new Date(date),
      bannerImage: bannerImageUrl,
      maxParticipants: parseInt(maxParticipants),
      location: {
        venue,
        maplink,
      },
      isOnline: venue.toLowerCase().includes("online") || !venue,
      createdByClub: clubId,
      registration: {
        isPaid: isPaid === "true",
        price: parseFloat(price) || 0,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    const content = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
    <p style="font-size: 15px; margin: 10px 0; color: #444;">
      ${description}
    </p>

    <div style="margin: 20px 0; padding: 15px; background-color: #edf2f7; border-radius: 8px;">
      <p><strong>🗓️ Date:</strong> ${new Date(date).toLocaleString("en-IN", {
        dateStyle: "full",
        timeStyle: "short",
      })}</p>
      <p><strong>🏷️ Type:</strong> ${type}</p>
      <p><strong>📍 Venue:</strong> ${venue || "Online Event"}</p>
      ${
        maplink
          ? `<p><strong>🗺️ Map:</strong> <a href="${maplink}" target="_blank" style="color: #3182ce;">View Location</a></p>`
          : ""
      }
      <p><strong>👥 Max Participants:</strong> ${maxParticipants}</p>
      <p><strong>💰 Price:</strong> ${
        isPaid === "true" ? `₹${parseFloat(price)}` : "Free"
      }</p>
      ${
        deadline
          ? `<p><strong>📌 Registration Deadline:</strong> ${new Date(
              deadline
            ).toLocaleString("en-IN", {
              dateStyle: "full",
              timeStyle: "short",
            })}</p>`
          : ""
      }
      <p><strong>🏷️ Tags:</strong> ${parsedTags.join(", ")}</p>
    </div>

    <p style="margin-top: 20px;">✅ Don’t miss out! Register now and be part of this exciting event brought to you by your club.</p>

    ${
      bannerImageUrl
        ? `<div style="margin-top: 20px;">
          <img src="${bannerImageUrl}" alt="Event Banner" style="max-width: 100%; border-radius: 6px;" />
        </div>`
        : ""
    }

    <p style="margin-top: 25px; font-size: 12px; color: #888;">If you did not expect this invitation, please ignore this email.</p>
  </div>
`;

    sendNotificationEmail({
      title: name,
      heading: name,
      content,
      type: "event",
    });

    await newEvent.save();

    await Club.findByIdAndUpdate(
      clubId,
      { $push: { events: newEvent._id } },
      { new: true }
    );

    return res.status(201).json({
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (err) {
    console.error("Error creating event:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
};

//*DONE
export const getEventById = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user?.id;

  if (!eventId) {
    return res.status(400).json({ message: "Event ID is required." });
  }

  try {
    const event = await Event.findById(eventId)
      .populate({
        path: "createdByClub",
        select: "name profileImage", // Only include necessary club info
      })
      .populate({
        path: "participants",
        populate: {
          path: "user", // each ticket has a "user" field
          select: "name profile.picture", // only name and profile pic
        },
      });

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const formattedEvent = {
      _id: event._id.toString(),
      name: event.name,
      type: event.type,
      tags: event.tags,
      description: event.description,
      bannerImage: event.bannerImage,
      date: event.date.toISOString(),
      maxParticipants: event.maxParticipants,
      location: {
        venue: event.location?.venue || "",
        maplink: event.location?.maplink || "",
      },
      isOnline: event.isOnline,
      createdByClub: event.createdByClub
        ? {
            _id: event.createdByClub._id.toString(),
            name: event.createdByClub.name,
            logo: event.createdByClub.profileImage || "",
          }
        : undefined,
      registration: {
        isPaid: event.registration?.isPaid || false,
        price: event.registration?.price || 0,
        deadline: event.registration?.deadline
          ? event.registration.deadline.toISOString()
          : "",
      },
      participants: (event.participants || []).map((ticket) => ({
        _id: ticket._id.toString(),
        user: {
          _id: ticket.user?._id?.toString() || "",
          name: ticket.user?.name || "Unknown",
          profile: {
            picture: ticket.user?.profile?.picture || "",
          },
        },
      })),
    };

    let isParticipant = false;
    if (userId) {
      isParticipant = event.participants.some(
        (ticket) => ticket.user?._id?.toString() === userId
      );
    }

    res.status(200).json({ event: formattedEvent, isParticipant });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

//*DONE
export const registerForFreeEvent = async (req, res) => {
  const userId = req.user?.id;
  const { eventId } = req.body;

  if (!userId || !eventId) {
    return res.status(400).json({ error: "Missing userId or eventId." });
  }

  try {
    // Check if the event exists and is free
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    if (event.registration?.isPaid) {
      return res.status(400).json({ error: "This event requires payment." });
    }

    // Check if user already has a ticket
    const existingTicket = await Ticket.findOne({
      user: userId,
      event: eventId,
    });
    if (existingTicket) {
      return res
        .status(409)
        .json({ error: "Already registered for this event." });
    }

    // Generate unique ticket token
    const ticketToken = crypto.randomBytes(10).toString("hex");

    // Create the ticket
    const ticket = new Ticket({
      user: userId,
      event: eventId,
      ticketToken,
      hasPaid: true,
    });

    assignActivityPoints(userId, 5);
    const savedTicket = await ticket.save();

    // Update the User
    await User.findByIdAndUpdate(userId, {
      $addToSet: { registeredEvents: eventId },
    });

    // Update the Event
    await Event.findByIdAndUpdate(eventId, {
      $addToSet: { participants: savedTicket._id },
    });

    sendNotificationToUser(userId, {
      type: "event",
      message:
        "Your ticket has been bought successfully. Check registered events.",
      relatedEvent: eventId,
    });
    return res.status(201).json({
      message: "Registered successfully for the free event.",
      ticket: savedTicket,
    });
  } catch (err) {
    console.error("Error in registerForFreeEvent:", err);
    return res.status(500).json({ error: "Server error." });
  }
};

//*DONE STRIPE
export const registerForPaidEvent = async (req, res) => {
  const { eventId, price, eventName } = req.body;
  const userId = req.user?.id;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: eventName,
            },
            unit_amount: price * 100, // in paise
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId,
        userId,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/events/${eventId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/events/${eventId}/error`,
    });

    res.status(200).json({ checkoutUrl: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe session creation failed" });
  }
};

//*DONE
export const verifyAndGenerateTicket = async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: "Missing session_id" });

  try {
    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const { userId, eventId } = session.metadata;

    if (
      !session.metadata ||
      !session.metadata.userId ||
      !session.metadata.eventId
    ) {
      return res.status(400).json({ error: "Missing metadata in session" });
    }

    // Check if already fulfilled (avoid duplicate tickets)
    const existingTicket = await Ticket.findOne({
      user: userId,
      event: eventId,
    });
    // console.log("Existing Ticket Check Result:", existingTicket);
    if (existingTicket) {
      return res.status(200).json({
        ticket: existingTicket,
        message: "Already registered for this event.",
      });
    }

    // Create Ticket
    const createTicket = async () => {
      // Create unique ticket token
      const ticketToken = crypto.randomBytes(16).toString("hex");
      const ticket = await Ticket.create({
        user: userId,
        event: eventId,
        hasPaid: true,
        ticketToken,
      });

      // Update user and event
      await User.findByIdAndUpdate(userId, {
        $addToSet: { registeredEvents: eventId },
      });

      await Event.findByIdAndUpdate(eventId, {
        $addToSet: { participants: ticket._id },
      });

      assignActivityPoints(userId, 15);
      sendNotificationToUser(userId, {
        type: "event",
        message:
          "Your ticket has been bought successfully. Check registered events.",
        relatedEvent: eventId,
      });

      res.status(200).json({ ticket: ticket });
    };
    if (!existingTicket) {
      createTicket();
    }
  } catch (err) {
    console.error("Failed to verify session or create ticket:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//
export const getAllEvents = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Fetch all events with associated club and participant ticket info
    const events = await Event.find()
      .select(
        "name bannerImage type date location maxParticipants participants createdByClub"
      )
      .populate({
        path: "participants",
        model: "Ticket",
        select: "user",
      })
      .populate({
        path: "createdByClub",
        model: "Club",
        select: "name",
      });

    const eventCards = events.map((event) => {
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
        clubName: event.createdByClub?.name || "Unknown Club",
        venue: event.location?.venue || "Online",
        date: event.date.toISOString(),
        participants: event.participants?.length || 0,
        isRegistered: isUserRegistered,
      };
    });

    return res.status(200).json({ event: eventCards });
  } catch (err) {
    console.error("Error fetching all event cards:", err);
    return res.status(500).json({ error: "Failed to fetch events." });
  }
};
