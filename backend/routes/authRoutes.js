import express from "express";
import pool from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Generate JWT Token
const generateToken = (user, role) => {
    return jwt.sign({ id: user.customer_id || user.admin_id || user.trainer_id, role }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Customer Registration
router.post("/customer/register", async (req, res) => {
    try {
        const { customer_name, customer_email, customer_phone, customer_password } = req.body;

        // Check if email already exists
        const checkCustomer = await pool.query("SELECT * FROM Customer WHERE customer_email = $1", [customer_email]);
        if (checkCustomer.rows.length > 0) {
            return res.status(400).json({ error: "Customer already exists with this email" });
        }

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(customer_password, 10);

        // Insert new customer into database
        const result = await pool.query(
            "INSERT INTO Customer (customer_name, customer_email, customer_phone, customer_password) VALUES ($1, $2, $3, $4) RETURNING customer_id, customer_name, customer_email, customer_phone",
            [customer_name, customer_email, customer_phone, hashedPassword]
        );

        // Generate token for new customer
        const token = generateToken(result.rows[0], "customer");

        res.status(201).json({ token, user: result.rows[0] });
    } catch (error) {
        console.error("Error registering customer:", error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// Generic Login Function
const loginUser = async (req, res, tableName, idField, role) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Fetch user from the correct table
        const result = await pool.query(`SELECT * FROM ${tableName} WHERE ${role}_email = $1`, [email]);
        if (result.rows.length === 0) {
            console.log(`${role} not found:`, email);
            return res.status(400).json({ message: `${role} not found` });
        }

        const user = result.rows[0];

        // Compare the hashed password
        const isMatch = await bcrypt.compare(password, user[`${role}_password`]);
        if (!isMatch) {
            console.log("Invalid password for:", email);
            return res.status(400).json({ message: "Invalid password" });
        }

        // Generate JWT Token
        const token = generateToken(user, role);

        res.json({ token, user: { id: user[idField], name: user[`${role}_name`], email: user[`${role}_email`] } });
    } catch (error) {
        console.error(`${role} login error:`, error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Admin, Trainer, Customer Login Routes
router.post("/admin/login", (req, res) => loginUser(req, res, "Admin", "admin_id", "admin"));
router.post("/trainer/login", (req, res) => loginUser(req, res, "Trainer", "trainer_id", "trainer"));
router.post("/customer/login", (req, res) => loginUser(req, res, "Customer", "customer_id", "customer"));

export default router;