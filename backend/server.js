import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import customerRoutes from "./routes/customerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import trainerRoutes from "./routes/trainerRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import bookingRoutes from "./routes/bookingRoutes.js"; // Import booking routes
import membershipRoutes from "./routes/membershipRoutes.js"; // Import membership routes
import paymentRoutes from "./routes/paymentRoutes.js"; // Import payment routes
import fieldRoutes from "./routes/fieldRoutes.js"; // Import field routes
import scheduleRoutes from "./routes/scheduleRoutes.js"; // Import schedule routes
import feedbackRoutes from "./routes/feedbackRoutes.js"; // Import field routes

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Public Routes
app.use("/api/auth", authRoutes);  // Authorization routes (login, register)
app.use("/api/fields", fieldRoutes);  // Fields route (view, create, etc.)
app.use("/api/bookings", bookingRoutes); // Booking route (view, create, etc.)
app.use("/api/memberships", membershipRoutes); // Membership route (view, create, etc.)
app.use("/api/payments", paymentRoutes); // Payment route (payment history, etc.)
app.use("/api/schedule", scheduleRoutes);  // Schedule routes (view and update schedule)
app.use("/api/feedback", feedbackRoutes);  // Feedback routes (view, create, update feedback)

// Protected Routes (Require JWT)
app.use("/api/customers", authMiddleware, customerRoutes);  // Customer routes (view and update profile)
app.use("/api/admins", adminRoutes);  // Admin routes (CRUD for admin)
app.use("/api/trainers", authMiddleware, trainerRoutes);  // Trainer routes (CRUD for trainer)

// Welcome Route
app.get("/", (req, res) => {
    res.send("✅ Welcome to Project1 Backend 🚀");
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
