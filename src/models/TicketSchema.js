const TicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  ticketToken: { type: String, unique: true },
  hasPaid: Boolean,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Ticket", TicketSchema);
