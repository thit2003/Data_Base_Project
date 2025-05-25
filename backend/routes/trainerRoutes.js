import express from "express";
import pool from "../db.js";
import bcrypt from "bcryptjs";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/** ✅ Admin Adds a New Trainer */
router.post("/", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access Denied: Only admin can add trainers" });
        }

        const { trainer_name, trainer_email, trainer_phone, trainer_password } = req.body;

        // ✅ Check if trainer already exists (Fixed: Use LOWERCASE for case-insensitive check)
        const checkTrainer = await pool.query("SELECT * FROM Trainer WHERE LOWER(trainer_email) = LOWER($1)", [trainer_email]);
        if (checkTrainer.rows.length > 0) {
            return res.status(400).json({ error: "❌ Trainer with this email already exists." });
        }

        // ✅ Hash password before storing
        const hashedPassword = await bcrypt.hash(trainer_password, 10);

        const result = await pool.query(
            "INSERT INTO Trainer (trainer_name, trainer_email, trainer_phone, trainer_password) VALUES ($1, $2, $3, $4) RETURNING trainer_id, trainer_name, trainer_email, trainer_phone",
            [trainer_name, trainer_email, trainer_phone, hashedPassword]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding trainer:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

/** ✅ Admin Fetches All Trainers */
router.get("/", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access Denied: Only admin can view all trainers" });
        }

        const result = await pool.query("SELECT trainer_id, trainer_name, trainer_email, trainer_phone FROM Trainer Order By trainer_id");
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching trainers:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

/** ✅ Trainer Fetches Their Own Schedule */
router.get("/schedule", authMiddleware, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(403).json({ error: "Access Denied: Invalid session" });
        }

        const trainerId = req.user.id; // ✅ Extract trainer ID from token

        // ✅ Fetch the trainer's schedule from Trainer_Schedule table
        const result = await pool.query(
            `SELECT t.trainer_name, ts.day_of_week, ts.is_available
            FROM Trainer_Schedule ts
            JOIN Trainer t ON ts.trainer_id = t.trainer_id
            WHERE ts.trainer_id = $1
            ORDER BY ts.schedule_id`,
            [trainerId]
        );

        if (result.rows.length === 0) {
            console.log("⚠️ No schedule found for trainer ID:", trainerId);
            return res.status(404).json({ message: "No schedule found for this trainer" });
        }

        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching trainer schedule:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/** ✅ Trainer Fetches Approved Feedback */
router.get("/feedback", authMiddleware, async (req, res) => {
    try {
        const trainerId = req.user.id; // Get trainer ID from token

        console.log("Fetching feedback for trainer ID:", trainerId);

        // ✅ Fetch only feedback marked as "addressed"
        const result = await pool.query(
            `SELECT f.feedback_id, f.feedback_text, f.feedback_date, c.customer_name
            FROM Feedback f
            JOIN Customer c ON f.customer_id = c.customer_id
            WHERE f.feedback_status = 'addressed'
            ORDER BY f.feedback_date DESC`
        );

        if (result.rows.length === 0) {
            console.log("⚠️ No approved feedback found");
            return res.status(404).json({ message: "No approved feedback available" });
        }

        console.log("✅ Trainer Feedback Data:", result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching trainer feedback:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


/** ✅ Trainer Fetches Their Own Profile */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query("SELECT trainer_id, trainer_name, trainer_email, trainer_phone FROM Trainer WHERE trainer_id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Trainer not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching trainer:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/** ✅ Admin Can Delete a Trainer */
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access Denied: Only admin can delete trainers" });
        }

        const { id } = req.params;
        const result = await pool.query("DELETE FROM Trainer WHERE trainer_id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Trainer not found" });
        }

        res.json({ message: "Trainer deleted successfully" });
    } catch (error) {
        console.error("Error deleting trainer:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

export default router;