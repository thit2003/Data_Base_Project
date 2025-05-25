import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/** ✅ Fetch Trainer Schedule (Public - No Token Required) */
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ts.trainer_id, t.trainer_name, ts.day_of_week, ts.is_available
            FROM Trainer_Schedule ts
            JOIN Trainer t ON ts.trainer_id = t.trainer_id
            ORDER BY t.trainer_id, ts.day_of_week;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching schedule:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

/** ✅ Update Trainer Schedule */
router.post("/", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access Denied: Only admin can update schedules" });
        }

        const { schedule } = req.body;

        await pool.query("DELETE FROM Trainer_Schedule");

        const query = `
            INSERT INTO Trainer_Schedule (trainer_id, day_of_week, is_available)
            VALUES ($1, $2, $3)
        `;

        for (const entry of schedule) {
            await pool.query(query, [entry.trainer_id, entry.day_of_week, entry.is_available]);
        }

        res.json({ message: "Schedule updated successfully" });
    } catch (error) {
        console.error("Error updating schedule:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

export default router;