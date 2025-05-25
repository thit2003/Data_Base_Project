import express from "express";
import pool from "../db.js"; // Import database connection
import authMiddleware from "../middleware/authMiddleware.js"; // Protect routes

const router = express.Router();

// ✅ Get all fields
// In your backend, make sure the GET /api/fields route doesn't require authentication
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM Field ORDER BY field_id");
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching fields:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});


// ✅ Get a single field by ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM Field WHERE field_id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Field not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching field:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// ✅ Create a new field (admin access only)
router.post("/", authMiddleware, async (req, res) => {
    try {
        // Only admin can create a new field
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access Denied: Only admin can add fields" });
        }

        const { field_name, field_type, hourly_rate, field_status, image_path, field_location } = req.body;

        // Insert the new field into the database
        const result = await pool.query(
            "INSERT INTO Field (field_name, field_type, hourly_rate, field_status, image_path, field_location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [field_name, field_type, hourly_rate, field_status, image_path, field_location]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating field:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// ✅ Update a field (admin access only)
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        // Only admin can update fields
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access Denied: Only admin can update fields" });
        }

        const { id } = req.params;
        const { field_name, field_type, hourly_rate, field_status, image_path, field_location } = req.body;

        const result = await pool.query(
            "UPDATE Field SET field_name = $1, field_type = $2, hourly_rate = $3, field_status = $4, image_path = $5, field_location = $6 WHERE field_id = $7 RETURNING *",
            [field_name, field_type, hourly_rate, field_status, image_path, field_location, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Field not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating field:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});


// ✅ Delete a field (admin access only)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        // Only admin can delete fields
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access Denied: Only admin can delete fields" });
        }

        const { id } = req.params;
        const result = await pool.query("DELETE FROM Field WHERE field_id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Field not found" });
        }

        res.json({ message: "Field deleted successfully" });
    } catch (error) {
        console.error("Error deleting field:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

export default router;
