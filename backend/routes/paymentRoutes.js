import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/** ✅ 3. Admin Views All Payments (With Field & Membership Names) */
router.get("/", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            console.log("You are not an Admin!!");
            return res.status(403).json({ error: "Access Denied: Only admin can view all payments" });
        }

        const result = await pool.query(`
            SELECT p.payment_id, p.customer_id, p.booking_id, p.membership_id, 
                    p.payment_status, p.payment_date, p.amount,
                    COALESCE(c.customer_name, 'Unknown') AS customer_name,
                    COALESCE(f.field_name, '-') AS field_name, 
                    COALESCE(m.type, '-') AS membership_type
            FROM Payment p
            LEFT JOIN Customer c ON p.customer_id = c.customer_id
            LEFT JOIN Booking b ON p.booking_id = b.booking_id
            LEFT JOIN Field f ON b.field_id = f.field_id
            LEFT JOIN Membership m ON p.membership_id = m.membership_id
            ORDER BY p.payment_date DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching payments:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});


/** ✅ 1. Customers Make a Payment */
router.post("/", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({ error: "Access Denied: Only customers can make payments" });
        }

        const { payment_type, reference_id } = req.body;
        const customer_id = req.user.id;
        let amount = 0;

        // Determine if it's a booking or membership payment
        if (payment_type === "booking") {
            // Fetch booking details and the field's hourly rate
            const booking = await pool.query("SELECT * FROM Booking WHERE booking_id = $1 AND customer_id = $2", [reference_id, customer_id]);
            if (booking.rows.length === 0) {
                return res.status(404).json({ error: "Booking not found or does not belong to this customer" });
            }

            // Fetch field details to get the hourly rate
            const field = await pool.query("SELECT * FROM Field WHERE field_id = $1", [booking.rows[0].field_id]);
            if (field.rows.length === 0) {
                return res.status(404).json({ error: "Field not found" });
            }

            // Calculate the total amount for the booking
            amount = field.rows[0].hourly_rate * booking.rows[0].duration;
        } else if (payment_type === "membership") {
            const membership = await pool.query("SELECT * FROM Membership WHERE membership_id = $1 AND customer_id = $2", [reference_id, customer_id]);
            if (membership.rows.length === 0) {
                return res.status(404).json({ error: "Membership not found or does not belong to this customer" });
            }
            amount = parseFloat(membership.rows[0].price);
        } else {
            return res.status(400).json({ error: "Invalid payment type. Use 'booking' or 'membership'" });
        }

        // Insert the payment into the database
        const result = await pool.query(
            "INSERT INTO Payment (customer_id, payment_status, payment_date, amount, booking_id, membership_id) VALUES ($1, 'pending', CURRENT_DATE, $2, $3, $4) RETURNING *",
            [customer_id, amount, payment_type === "booking" ? reference_id : null, payment_type === "membership" ? reference_id : null]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error making payment:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

/** ✅ 2. Customers View Their Payment History */
router.get("/my-payments", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({ error: "Access Denied: Only customers can view their payments" });
        }

        const customer_id = req.user.id;
        const result = await pool.query("SELECT * FROM Payment WHERE customer_id = $1", [customer_id]);

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching payments:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});


/** ✅ 4. Admin Updates Payment Status */
router.put("/:id/status", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access Denied: Only admin can update payment status" });
        }

        const { id } = req.params;
        const { status } = req.body;

        // Ensure the status is valid
        if (!["pending", "completed", "failed"].includes(status)) {
            return res.status(400).json({ error: "Invalid status. Allowed values: 'pending', 'completed', 'failed'" });
        }

        const result = await pool.query(
            "UPDATE Payment SET payment_status = $1 WHERE payment_id = $2 RETURNING *",
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Payment not found" });
        }

        const payment = result.rows[0];

        // ✅ If payment is completed, update the linked booking or membership
        if (status === "completed") {
            if (payment.booking_id) {
                await pool.query("UPDATE Booking SET status = 'approved' WHERE booking_id = $1", [payment.booking_id]);
            }
            if (payment.membership_id) {
                await pool.query("UPDATE Membership SET membership_status = 'active' WHERE membership_id = $1", [payment.membership_id]);
            }
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating payment status:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

export default router;
