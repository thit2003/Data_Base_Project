import express from "express";
import pool from "../db.js"; // Import database connection
import bcrypt from "bcryptjs"; // Import bcrypt for hashing
import authMiddleware from "../middleware/authMiddleware.js"; // Protect routes

const router = express.Router();

// Get all customers with membership details (protected route)
router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                c.customer_id, 
                c.customer_name, 
                c.customer_email, 
                c.customer_phone,
                m.type AS membership_type, 
                m.membership_status
            FROM Customer c
            LEFT JOIN Membership m ON c.customer_id = m.customer_id
            ORDER BY c.customer_id
        `); 
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching customers:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// ✅ Get logged-in customer profile
router.get("/me", authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== "customer") {
            return res.status(403).json({ error: "Access Denied: Only customers can view their profile" });
        }

        const customer = await pool.query(
            "SELECT customer_id, customer_name, customer_email, customer_phone FROM Customer WHERE customer_id = $1",
            [req.user.id] // ✅ This is now a valid integer
        );

        if (customer.rows.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        res.json(customer.rows[0]);
    } catch (error) {
        console.error("Error fetching customer profile:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// Get a single customer by ID (protected)
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT customer_id, customer_name, customer_email, customer_phone FROM Customer WHERE customer_id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching customer:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// Create a new customer (hash password)
router.post("/", async (req, res) => {
    try {
        const { customer_name, customer_email, customer_phone, customer_password } = req.body;

        // Check if email already exists
        const checkCustomer = await pool.query("SELECT * FROM Customer WHERE customer_email = $1", [customer_email]);
        if (checkCustomer.rows.length > 0) {
            return res.status(400).json({ error: "Customer already exists with this email" });
        }

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(customer_password, 10);

        const result = await pool.query(
            "INSERT INTO Customer (customer_name, customer_email, customer_phone, customer_password) VALUES ($1, $2, $3, $4) RETURNING customer_id, customer_name, customer_email, customer_phone",
            [customer_name, customer_email, customer_phone, hashedPassword]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error adding customer:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// ✅ Update a customer (hash password if changed)
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        let { customer_name, customer_phone } = req.body;

        // ✅ Build dynamic update query based on provided fields
        let updateFields = [];
        let updateValues = [];
        
        if (customer_name) {
            updateFields.push("customer_name = $" + (updateValues.length + 1));
            updateValues.push(customer_name);
        }
        if (customer_phone) {
            updateFields.push("customer_phone = $" + (updateValues.length + 1));
            updateValues.push(customer_phone);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: "No changes provided." });
        }

        // ✅ Add WHERE clause
        updateValues.push(id);
        const updateQuery = `UPDATE Customer SET ${updateFields.join(", ")} WHERE customer_id = $${updateValues.length} RETURNING customer_id, customer_name, customer_phone`;

        // ✅ Execute Query
        const result = await pool.query(updateQuery, updateValues);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating customer:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// Delete a customer (protected)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM Customer WHERE customer_id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        res.json({ message: "Customer deleted successfully" });
    } catch (err) {
        console.error("Error deleting customer:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

export default router;
