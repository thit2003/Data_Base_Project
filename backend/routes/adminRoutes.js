import express from "express";
import authMiddleware from "../middleware/authMiddleware.js"; // Import middleware to verify token 
import pool from "../db.js"; // Import database connection
import bcrypt from "bcryptjs"; // Import bcrypt for hashing

const router = express.Router();

// Get admin
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT admin_id, admin_name, admin_email, admin_phone FROM Admin"); // Exclude password for security
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

/** ✅ Admin Fetches Dashboard Metrics */
router.get("/dashboard", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access Denied: Only admin can access dashboard" });
        }

        // ✅ Fetch key statistics
        const revenueResult = await pool.query("SELECT SUM(amount) AS total_revenue FROM Payment WHERE payment_status = 'completed'");
        const membershipsResult = await pool.query("SELECT COUNT(*) AS active_memberships FROM Membership WHERE membership_status = 'active'");
        const bookingsResult = await pool.query("SELECT COUNT(*) AS total_bookings FROM Booking");
        const trainersResult = await pool.query("SELECT COUNT(*) AS active_trainers FROM Trainer");

        // ✅ Fetch latest bookings
        const latestBookingsResult = await pool.query(
            `SELECT b.booking_id, c.customer_name, f.field_name, b.booking_date, b.status 
             FROM Booking b
             JOIN Customer c ON b.customer_id = c.customer_id
             JOIN Field f ON b.field_id = f.field_id
             ORDER BY b.booking_date DESC LIMIT 5`
        );

        // ✅ Fetch membership distribution
        const membershipDistributionResult = await pool.query(
            `SELECT type, COUNT(*) as count FROM Membership GROUP BY type`
        );

        // ✅ Fetch field usage statistics
        const fieldUsageResult = await pool.query(
            `SELECT f.field_name, COUNT(b.booking_id) AS usage_count 
             FROM Booking b 
             JOIN Field f ON b.field_id = f.field_id 
             GROUP BY f.field_name`
        );

        res.json({
            total_revenue: revenueResult.rows[0].total_revenue || 0,
            active_memberships: membershipsResult.rows[0].active_memberships || 0,
            total_bookings: bookingsResult.rows[0].total_bookings || 0,
            active_trainers: trainersResult.rows[0].active_trainers || 0,
            latest_bookings: latestBookingsResult.rows,
            membership_distribution: membershipDistributionResult.rows,
            field_usage: fieldUsageResult.rows
        });
    } catch (error) {
        console.error("❌ Error fetching dashboard metrics:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Fetch Admin Profile (Only for Logged-in Admin)
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const adminId = req.user.id; // Extract admin ID from token
        const result = await pool.query(
            "SELECT admin_id, admin_name, admin_email, admin_phone FROM Admin WHERE admin_id = $1",
            [adminId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Admin not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching admin profile:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});


// Get a single admin by ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT admin_id, admin_name, admin_email, admin_phone FROM Admin WHERE admin_id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Admin not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// Create a new admin (with password hashing)
router.post("/", async (req, res) => {
    try {
        const { admin_name, admin_email, admin_phone, admin_password } = req.body;

        // Check if admin already exists
        const checkAdmin = await pool.query("SELECT * FROM Admin WHERE admin_email = $1", [admin_email]);
        if (checkAdmin.rows.length > 0) {
            return res.status(400).json({ error: "Admin already exists with this email" });
        }

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(admin_password, 10);

        const result = await pool.query(
            "INSERT INTO Admin (admin_name, admin_email, admin_phone, admin_password) VALUES ($1, $2, $3, $4) RETURNING admin_id, admin_name, admin_email, admin_phone",
            [admin_name, admin_email, admin_phone, hashedPassword]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// Update an admin (including password update)
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let { admin_name, admin_email, admin_phone, admin_password } = req.body;
        
        let updateQuery = "UPDATE Admin SET admin_name = $1, admin_email = $2, admin_phone = $3";
        let updateValues = [admin_name, admin_email, admin_phone];

        // If password is provided, hash it before updating
        if (admin_password) {
            const hashedPassword = await bcrypt.hash(admin_password, 10);
            updateQuery += ", admin_password = $4";
            updateValues.push(hashedPassword);
        }

        updateQuery += " WHERE admin_id = $5 RETURNING admin_id, admin_name, admin_email, admin_phone";
        updateValues.push(id);

        const result = await pool.query(updateQuery, updateValues);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Admin not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// ✅ Update Admin Profile (Logged-in Admin)
router.put("/me", authMiddleware, async (req, res) => {
    try {
        const adminId = req.user.id; // Extract admin ID from token
        let { admin_name, admin_email, admin_phone, admin_password } = req.body;

        let updateQuery = "UPDATE Admin SET admin_name = $1, admin_email = $2, admin_phone = $3";
        let updateValues = [admin_name, admin_email, admin_phone];

        // ✅ If password is provided, hash it before updating
        if (admin_password) {
            const hashedPassword = await bcrypt.hash(admin_password, 10);
            updateQuery += ", admin_password = $4";
            updateValues.push(hashedPassword);
        }

        updateQuery += " WHERE admin_id = $5 RETURNING admin_id, admin_name, admin_email, admin_phone";
        updateValues.push(adminId);

        const result = await pool.query(updateQuery, updateValues);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Admin not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating admin profile:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// Delete an admin
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM Admin WHERE admin_id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Admin not found" });
        }

        res.json({ message: "Admin deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

export default router;
