import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Fixed membership pricing
const MEMBERSHIP_PRICES = {
    monthly: 2000.00,
    yearly: 20000.00
};

/** ✅ 1. Customers Purchase a Membership (Fixed Pricing) */
router.post("/", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({ error: "Access Denied: Only customers can purchase memberships" });
        }

        const { type } = req.body;
        const customer_id = req.user.id;

        // Validate membership type
        if (!["monthly", "yearly"].includes(type)) {
            return res.status(400).json({ error: "Invalid membership type. Choose 'monthly' or 'yearly'." });
        }

        // Assign fixed price
        const price = MEMBERSHIP_PRICES[type];

        // Insert membership without expiry_date (PostgreSQL auto-generates it)
        const result = await pool.query(
            `INSERT INTO Membership (customer_id, price, type, membership_status) 
            VALUES ($1, $2, $3, 'active') 
            RETURNING *`,
            [customer_id, price, type]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error purchasing membership:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

/** ✅ 2. Customers View Their Membership */
router.get("/my-membership", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({ error: "Access Denied: Only customers can view their memberships" });
        }

        const customer_id = req.user.id;
        const result = await pool.query("SELECT * FROM Membership WHERE customer_id = $1", [customer_id]);

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching membership:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

/** ✅ 3. Admin Views All Memberships */
router.get("/", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access Denied: Only admin can view all memberships" });
        }

        const result = await pool.query("SELECT * FROM Membership");

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching memberships:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

/** ✅ 4. Admin Cancels a Membership */
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access Denied: Only admin can cancel memberships" });
        }

        const { id } = req.params;
        const result = await pool.query("DELETE FROM Membership WHERE membership_id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Membership not found" });
        }

        res.json({ message: "Membership canceled successfully" });
    } catch (error) {
        console.error("Error canceling membership:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

export default router;
