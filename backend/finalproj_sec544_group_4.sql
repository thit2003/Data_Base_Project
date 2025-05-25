-- Creating the Admin table to store administrator details
CREATE TABLE Admin (
    admin_id SERIAL PRIMARY KEY, -- Unique admin ID
    admin_name VARCHAR(255) NOT NULL, -- Admin's name
    admin_email VARCHAR(255) UNIQUE NOT NULL, -- Unique email for admin
    admin_phone VARCHAR(20) UNIQUE NOT NULL, -- Unique phone number for admin
    admin_password VARCHAR(255) NOT NULL -- Hashed password for authentication
);

-- Creating the Customer table to store customer details
CREATE TABLE Customer (
    customer_id SERIAL PRIMARY KEY, -- Unique customer ID
    customer_name VARCHAR(255) NOT NULL, -- Customer's name
    customer_email VARCHAR(255) UNIQUE NOT NULL, -- Unique email for customer
    customer_phone VARCHAR(20) UNIQUE NOT NULL, -- Unique phone number for customer
    customer_password VARCHAR(255) NOT NULL -- Hashed password for authentication
);

-- Creating the Trainer table to store trainer details
CREATE TABLE Trainer (
    trainer_id SERIAL PRIMARY KEY, -- Unique trainer ID
    trainer_name VARCHAR(255) NOT NULL, -- Trainer's name
    trainer_email VARCHAR(255) UNIQUE NOT NULL, -- Unique email for trainer
    trainer_phone VARCHAR(20) UNIQUE NOT NULL, -- Unique phone number for trainer
    trainer_password VARCHAR(255) NOT NULL -- Hashed password for authentication
);

-- Creating the Field table to store sports field details
CREATE TABLE Field (
    field_id SERIAL PRIMARY KEY, -- Unique field ID
    field_name VARCHAR(255) NOT NULL, -- Name of the field
    field_type VARCHAR(255) NOT NULL, -- Type of the field (e.g., soccer, basketball)
    hourly_rate DECIMAL(10,2) NOT NULL, -- Hourly rental rate
    field_status VARCHAR(50) CHECK (field_status IN ('available', 'unavailable')) NOT NULL, -- Availability status
    image_path VARCHAR(255), -- Path to field image
    field_location VARCHAR(255) -- Location of the field
);

-- Creating the Booking table to store field booking information
CREATE TABLE Booking (
    booking_id SERIAL, -- Unique booking ID
    customer_id INT NOT NULL, -- Foreign key reference to Customer
    field_id INT NOT NULL, -- Foreign key reference to Field
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Date of booking
    duration INT NOT NULL, -- Duration of booking in hours
    status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'canceled')) DEFAULT 'pending', -- Booking status
    PRIMARY KEY (customer_id, booking_id), -- Composite primary key (customer + booking)
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE, -- Delete bookings if customer is deleted
    FOREIGN KEY (field_id) REFERENCES Field(field_id) ON DELETE CASCADE -- Delete bookings if field is deleted
);

-- Creating the Membership table to manage customer memberships
CREATE TABLE Membership (
    membership_id SERIAL PRIMARY KEY, -- Unique membership ID
    customer_id INT NOT NULL, -- Foreign key reference to Customer
    price DECIMAL(10,2) NOT NULL, -- Membership price
    type VARCHAR(50) CHECK (type IN ('monthly', 'yearly')) NOT NULL, -- Type of membership
    membership_status VARCHAR(50) CHECK (membership_status IN ('active', 'expired', 'canceled')) NOT NULL, -- Membership status
    start_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Membership start date
    expiry_date DATE GENERATED ALWAYS AS 
        (CASE 
            WHEN type = 'monthly' THEN start_date + INTERVAL '1 month'
            WHEN type = 'yearly' THEN start_date + INTERVAL '1 year'
        END) STORED, -- Auto-calculated expiry date
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE -- Delete membership if customer is deleted
);

-- Creating the Payment table with a composite foreign key (customer_id, booking_id)
CREATE TABLE Payment (
    payment_id SERIAL PRIMARY KEY, -- Unique payment ID
    customer_id INT NOT NULL, -- Foreign key reference to Customer (matches composite key in Booking)
    booking_id INT, -- Foreign key reference to Booking (matches composite key in Booking)
    membership_id INT, -- Foreign key reference to Membership (if applicable)
    payment_status VARCHAR(50) CHECK (payment_status IN ('pending', 'completed', 'failed')) NOT NULL, -- Payment status
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Date of payment
    amount DECIMAL(10,2) NOT NULL, -- Payment amount
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE, -- Delete payments if customer is deleted
    FOREIGN KEY (customer_id, booking_id) REFERENCES Booking(customer_id, booking_id) ON DELETE CASCADE, -- Match composite key
    FOREIGN KEY (membership_id) REFERENCES Membership(membership_id) ON DELETE CASCADE -- Delete payments if membership is deleted
);

-- Creating the Feedback table to store customer feedback
CREATE TABLE Feedback (
    feedback_id SERIAL, -- Unique feedback ID
    customer_id INT NOT NULL, -- Foreign key reference to Customer
    feedback_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Date of feedback submission
    feedback_status VARCHAR(50) CHECK (feedback_status IN ('pending', 'addressed')) NOT NULL, -- Feedback resolution status
    feedback_text TEXT NOT NULL, -- Customer's feedback content
    PRIMARY KEY (customer_id, feedback_id), -- Composite primary key (customer + feedback)
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE -- Delete feedback if customer is deleted
);

CREATE TABLE Trainer_Schedule (
    schedule_id SERIAL PRIMARY KEY, -- Unique Schedule ID
    trainer_id INT NOT NULL, -- Foreign key reference to Trainer
    day_of_week VARCHAR(10) CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (trainer_id) REFERENCES Trainer(trainer_id) ON DELETE CASCADE -- Delete feedback if trainer is deleted
);

SELECT * FROM Admin;
SELECT * FROM Customer;
SELECT * FROM Trainer;
SELECT * FROM Field;
SELECT * FROM Booking;
SELECT * FROM Membership;
SELECT * FROM Payment;
SELECT * FROM Feedback;
SELECT * FROM Trainer_Schedule;


-- 1️ AUTHENTICATION QUERIES
-- 🔹 Admin, Trainer, and Customer Login
SELECT * FROM Admin WHERE admin_email = $1;
SELECT * FROM Trainer WHERE trainer_email = $1;
SELECT * FROM Customer WHERE customer_email = $1;

-- 🔹 Register a New Customer
INSERT INTO Customer (customer_name, customer_email, customer_phone, customer_password)
VALUES ($1, $2, $3, $4) RETURNING customer_id, customer_name, customer_email;

-- ======================================================

-- 2 ADMIN DASHBOARD QUERIES
-- 🔹 Fetch Key Metrics for Dashboard
SELECT SUM(amount) AS total_revenue FROM Payment WHERE payment_status = 'completed';
SELECT COUNT(*) AS active_memberships FROM Membership WHERE membership_status = 'active';
SELECT COUNT(*) AS total_bookings FROM Booking;
SELECT COUNT(*) AS active_trainers FROM Trainer;

-- 🔹 Fetch Latest 5 Bookings
SELECT b.booking_id, c.customer_name, f.field_name, b.booking_date, b.status 
FROM Booking b
JOIN Customer c ON b.customer_id = c.customer_id
JOIN Field f ON b.field_id = f.field_id
ORDER BY b.booking_date DESC 
LIMIT 5;

-- ======================================================

-- 3️ BOOKING QUERIES
-- 🔹 Customer Creates a Booking
INSERT INTO Booking (customer_id, field_id, booking_date, duration, status)
VALUES ($1, $2, $3, $4, 'pending') RETURNING booking_id;

-- 🔹 Fetch Logged-In Customer's Bookings
SELECT b.booking_id, f.field_name, b.booking_date, b.duration, b.status
FROM Booking b
JOIN Field f ON b.field_id = f.field_id
WHERE b.customer_id = $1;

-- 🔹 Admin Updates Booking Status
UPDATE Booking SET status = $1 WHERE booking_id = $2 RETURNING *;

-- ======================================================

-- 4️ CUSTOMER QUERIES
-- 🔹 Fetch All Customers (Admin)
SELECT customer_id, customer_name, customer_email, customer_phone FROM Customer ORDER BY customer_id;

-- 🔹 Fetch Customer’s Profile
SELECT customer_id, customer_name, customer_email, customer_phone FROM Customer WHERE customer_id = $1;

-- 🔹 Update Customer Information
UPDATE Customer SET customer_name = $1, customer_email = $2, customer_phone = $3 WHERE customer_id = $4 RETURNING *;

-- ======================================================

-- 5️ FEEDBACK QUERIES
-- 🔹 Submit Feedback
INSERT INTO Feedback (customer_id, feedback_text, feedback_status)
VALUES ($1, $2, 'pending') RETURNING feedback_id;

-- 🔹 Fetch All Feedback (Admin)
SELECT f.feedback_id, f.feedback_text, f.feedback_date, c.customer_name, f.feedback_status
FROM Feedback f
JOIN Customer c ON f.customer_id = c.customer_id
ORDER BY f.feedback_date DESC;

-- 🔹 Fetch Feedback for a Specific Trainer
SELECT f.feedback_id, f.feedback_text, f.feedback_date, c.customer_name, f.feedback_status
FROM Feedback f
JOIN Customer c ON f.customer_id = c.customer_id
WHERE f.trainer_id = $1 
ORDER BY f.feedback_date DESC;

-- 🔹 Update Feedback Status
UPDATE Feedback SET feedback_status = 'addressed' WHERE feedback_id = $1 RETURNING *;

-- 🔹 Delete Feedback
DELETE FROM Feedback WHERE feedback_id = $1 RETURNING *;

-- ======================================================

-- 6️ FIELD QUERIES
-- 🔹 Fetch All Fields
SELECT * FROM Field ORDER BY field_id;

-- 🔹 Fetch a Single Field by ID
SELECT * FROM Field WHERE field_id = $1;

-- 🔹 Create a New Field (Admin)
INSERT INTO Field (field_name, field_type, field_location, field_status, hourly_rate)
VALUES ($1, $2, $3, $4, $5) RETURNING field_id;

-- 🔹 Update a Field
UPDATE Field 
SET field_name = $1, field_type = $2, field_location = $3, field_status = $4, hourly_rate = $5 
WHERE field_id = $6 RETURNING *;

-- ======================================================

-- 7️ MEMBERSHIP QUERIES
-- 🔹 Purchase a Membership
INSERT INTO Membership (customer_id, price, type, membership_status)
VALUES ($1, $2, $3, 'active') RETURNING membership_id;

-- 🔹 Fetch Customer’s Membership
SELECT * FROM Membership WHERE customer_id = $1 AND membership_status = 'active';

-- ======================================================

-- 8️ PAYMENT QUERIES
-- 🔹 Process a Payment
INSERT INTO Payment (customer_id, payment_status, payment_date, amount, booking_id, membership_id)
VALUES ($1, 'pending', CURRENT_DATE, $2, $3, $4) RETURNING *;

-- 🔹 Fetch All Payments (Admin)
SELECT * FROM Payment ORDER BY payment_date DESC;

-- 🔹 Approve or Reject a Payment
UPDATE Payment SET payment_status = $1 WHERE payment_id = $2 RETURNING *;

-- ======================================================

-- 9️ SCHEDULE QUERIES
-- 🔹 Fetch Trainer's Schedule
SELECT day_of_week, is_available FROM Trainer_Schedule WHERE trainer_id = $1 ORDER BY day_of_week;

-- 🔹 Update Trainer's Schedule (Admin)
UPDATE Trainer_Schedule SET is_available = $1 WHERE trainer_id = $2 AND day_of_week = $3 RETURNING *;

-- ======================================================

-- 10 TRAINER QUERIES
-- 🔹 Fetch All Trainers
SELECT trainer_id, trainer_name, trainer_email, trainer_phone FROM Trainer ORDER BY trainer_id;

-- 🔹 Fetch Trainer’s Profile
SELECT trainer_id, trainer_name, trainer_email, trainer_phone FROM Trainer WHERE trainer_id = $1;

-- 🔹 Delete a Trainer
DELETE FROM Trainer WHERE trainer_id = $1 RETURNING *;





