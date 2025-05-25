import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/** ✅ Admin Fetches All Feedback */
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT f.feedback_id, c.customer_name, f.feedback_text, f.feedback_date, f.feedback_status
            FROM Feedback f
            JOIN Customer c ON f.customer_id = c.customer_id
            ORDER BY f.feedback_date DESC;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching feedback:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

/** ✅ Admin Updates Feedback Status */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback_status } = req.body;

        if (!["pending", "addressed"].includes(feedback_status)) {
            return res.status(400).json({ error: "Invalid status." });
        }

        const result = await pool.query(
            "UPDATE Feedback SET feedback_status = $1 WHERE feedback_id = $2 RETURNING *",
            [feedback_status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Feedback not found." });
        }

        res.json({ message: "✅ Feedback updated successfully!", feedback: result.rows[0] });
    } catch (error) {
        console.error("Error updating feedback:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

/** ✅ Submit Feedback (Public - No Authentication Required) */
router.post("/", async (req, res) => {
    try {
        const { customer_id, feedback_text } = req.body;

        // ✅ Ensure customer_id and feedback_text are provided
        if (!customer_id || !feedback_text) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        // ✅ Insert feedback into database
        const result = await pool.query(
            "INSERT INTO Feedback (customer_id, feedback_text, feedback_status) VALUES ($1, $2, 'pending') RETURNING *",
            [customer_id, feedback_text]
        );

        res.status(201).json({ message: "✅ Feedback submitted successfully!", feedback: result.rows[0] });
    } catch (error) {
        console.error("Error submitting feedback:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

export default router;