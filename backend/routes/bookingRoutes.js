import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/** ✅ 1. Customers Create a New Booking */
router.post("/", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({ error: "Access Denied: Only customers can create bookings" });
        }

        const { field_id, duration, booking_date } = req.body; // Add booking_date here
        const customer_id = req.user.id;

        // Check if booking_date is valid (for example, checking if the date format is correct)
        if (!booking_date) {
            return res.status(400).json({ error: "Booking date is required" });
        }

        // Check if field exists and is available
        const fieldCheck = await pool.query("SELECT * FROM Field WHERE field_id = $1 AND field_status = 'available'", [field_id]);
        if (fieldCheck.rows.length === 0) {
            return res.status(400).json({ error: "Field not available or does not exist" });
        }

        // Insert booking
        const result = await pool.query(
            "INSERT INTO Booking (customer_id, field_id, duration, booking_date) VALUES ($1, $2, $3, $4) RETURNING *",
            [customer_id, field_id, duration, booking_date] // Include booking_date in the query
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating booking:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

/** ✅ 2. Customers View Their Own Bookings */
router.get("/my-bookings", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({ error: "Access Denied: Only customers can view their bookings" });
        }

        const customer_id = req.user.id;

        // Query to join Booking with Field to fetch field_name and field_type
        const result = await pool.query(`
            SELECT 
                b.booking_id, 
                b.booking_date, 
                b.duration, 
                b.status, 
                f.field_name, 
                f.field_id 
            FROM Booking b
            JOIN Field f ON b.field_id = f.field_id
            WHERE b.customer_id = $1
            ORDER BY b.booking_id;
        `, [customer_id]);

        res.json(result.rows);  // Return the result as JSON
    } catch (error) {
        console.error("Error fetching customer bookings:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

/** ✅ 3. Admin Views All Bookings */
router.get("/", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access Denied: Only admin can view all bookings" });
        }

        const result = await pool.query(`
            SELECT 
                b.booking_id, 
                c.customer_name, 
                f.field_name, 
                b.booking_date, 
                b.duration, 
                b.status
            FROM Booking b
            JOIN Customer c ON b.customer_id = c.customer_id
            JOIN Field f ON b.field_id = f.field_id
            ORDER BY b.booking_date;
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching bookings:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

/** ✅ 4. Admin Approves/Rejects a Booking */
router.put("/:id/status", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access Denied: Only admin can update booking status" });
        }

        const { id } = req.params;
        const { status } = req.body;

        // Ensure the status is valid
        if (!["pending", "approved", "canceled"].includes(status)) {
            return res.status(400).json({ error: "Invalid status. Allowed values: 'pending', 'approved', 'canceled'" });
        }

        const result = await pool.query("UPDATE Booking SET status = $1 WHERE booking_id = $2 RETURNING *", [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating booking status:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

/** ✅ 5. Customers Cancel Their Own Booking */
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({ error: "Access Denied: Only customers can cancel their bookings" });
        }

        const { id } = req.params;
        const customer_id = req.user.id;

        const result = await pool.query("DELETE FROM Booking WHERE booking_id = $1 AND customer_id = $2 RETURNING *", [id, customer_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Booking not found or does not belong to you" });
        }

        res.json({ message: "Booking canceled successfully" });
    } catch (error) {
        console.error("Error canceling booking:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

export default router;
