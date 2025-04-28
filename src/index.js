import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Example route
app.get("/", (_, res) => res.send("API is running 🚀"));

//test route
app.get("/api/test", (_, res) => res.send("Test route is working!"));

// auth routes
app.use("/api/auth", authRoutes);

// Connect DB and Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
