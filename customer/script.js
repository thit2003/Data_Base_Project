document.addEventListener("DOMContentLoaded", () => {
    console.log("Page loaded!"); // Check if the page is loading

    updateNavbar(); // ✅ Update Navbar Based on Login Status

    const path = window.location.pathname.split("/").pop();
    console.log("Current Path:", path); // ✅ Debugging

    // ✅ Check if it's the customer schedule page
    if (path === "schedule.html") {
        console.log("Initializing schedule page..."); // ✅ Debugging
        loadCustomerSchedule();
    }

    // ✅ Check if it's the contact page
    if (path === "contact.html") {
        console.log("Initializing contact page..."); // ✅ Debugging
        feedbackFormReady();
    }

    // Skip token check for public pages like "Home", "Facilities", "About"
    if (["about.html"].includes(path)) {
        return; // No need to check login state for these pages
    }

    if (path === "index.html") {
        loadFields();  // Make sure to call loadFields on the index page
        addSmoothScrolling();
    }

    if (path === "memberships.html") {
        // Check if the customer already has a membership
        checkCustomerMembership();

        // Handle the "Join Plan" buttons
        const joinButtons = document.querySelectorAll(".membership-plan button");
        joinButtons.forEach(button => {
            button.addEventListener("click", () => {
                const planType = button.textContent.toLowerCase().includes("monthly") ? "monthly" : "yearly";
                joinMembership(planType);
            });
        });
    }

    if (path === "booking_form.html") {
        populateBookingForm();
    }

    if (path === "payment.html") {
        console.log("Populating payment details...");
        populatePaymentDetails(); // Check if this function is called
    }

    if (path === "customer_profile.html") {
        loadProfileData();
        fetchBookings();
        fetchMembership();
    } else if (path === "signup.html") {
        setupSignup();
    } else if (path === "login.html") {
        setupLogin();
    }
});

// ✅ Fetch Booking Details and Populate Payment Info
async function populatePaymentDetails() {
    console.log("Entering populatePaymentDetails()"); // Log the start of the function
    const token = localStorage.getItem("token");
    if (!token) {
        alert("❌ Unauthorized! Please log in.");
        window.location.href = "login.html"; // Redirect to login if not logged in
        return;
    }

    try {
        // Fetch booking information for the logged-in customer
        const bookingResponse = await fetch("http://localhost:5001/api/bookings/my-bookings", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });

        const bookingData = await bookingResponse.json();
        console.log("Booking Data:", bookingData); // Log the booking data

        if (bookingResponse.ok && bookingData.length > 0) {
            // Get the most recent booking (the last item in the array)
            const booking = bookingData[bookingData.length - 1]; // This will get the latest booking

            const fieldId = booking.field_id; // Get field ID for price lookup
            const fieldResponse = await fetch(`http://localhost:5001/api/fields/${fieldId}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` },
            });

            const fieldData = await fieldResponse.json();
            console.log("Field Data:", fieldData); // Log the field data

            if (fieldResponse.ok) {
                const price = fieldData.hourly_rate * booking.duration; // Ensure calculation is correct
                console.log("Calculated Price:", price); // Log the calculated price

                // Display price in the payment page
                document.getElementById("amount").textContent = `฿${price}`;
                document.getElementById("invoice-amount").textContent = `${price}`;
            } else {
                alert("❌ Error fetching field details.");
            }
        } else {
            alert("❌ No booking found.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// ✅ Handle Payment Confirmation
document.getElementById("confirm-payment-btn")?.addEventListener("click", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("❌ Unauthorized! Please log in.");
        window.location.href = "login.html"; // Redirect to login if not logged in
        return;
    }

    try {
        // ✅ Fetch all bookings for this customer
        const bookingResponse = await fetch("http://localhost:5001/api/bookings/my-bookings", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });

        const bookingData = await bookingResponse.json();

        // ✅ Find the most recent booking (latest one in the list)
        const latestBooking = bookingData.length > 0 ? bookingData[bookingData.length - 1] : null;

        if (!latestBooking) {
            alert("❌ No booking found.");
            return;
        }

        const bookingId = latestBooking.booking_id; // ✅ Get latest booking ID

        // ✅ Send payment request to the backend
        const response = await fetch("http://localhost:5001/api/payments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ payment_type: "booking", reference_id: bookingId }) // ✅ Correct booking ID
        });

        const data = await response.json();
        if (response.ok) {
            alert("✅ Payment confirmed successfully!");
            window.location.href = "index.html"; // Redirect to home page
        } else {
            alert(`❌ Payment failed: ${data.error}`);
        }
    } catch (error) {
        console.error("Payment Error:", error);
    }
});


// ✅ Fetch Customer's Name and Field Data for the Booking Form
async function populateBookingForm() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("❌ Unauthorized! Please log in.");
        window.location.href = "login.html"; // Redirect to login if not logged in
        return;
    }

    try {
        // Fetch customer info (just in case you need it for booking form)
        const userResponse = await fetch("http://localhost:5001/api/customers/me", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });

        const userData = await userResponse.json();
        if (userResponse.ok) {
            document.getElementById("customer_name").value = userData.customer_name;
        } else {
            alert("❌ Error fetching customer details.");
        }

        // Get selected field ID from localStorage
        const fieldId = localStorage.getItem("selectedFieldId"); // Assuming field id is stored after clicking "Book Now"

        if (!fieldId) {
            alert("❌ Error: No field selected.");
            window.location.href = "index.html"; // Redirect to the index page if no field selected
            return;
        }

        const fieldResponse = await fetch(`http://localhost:5001/api/fields/${fieldId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });

        const fieldData = await fieldResponse.json();
        if (fieldResponse.ok) {
            document.getElementById("field-name").value = fieldData.field_name;
            document.getElementById("field-location").value = fieldData.field_location;
            document.getElementById("field-type").value = fieldData.field_type; // Add field type if needed
        } else {
            alert("❌ Error fetching field data.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

// ✅ Handle Booking Submission
document.getElementById("booking-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const fieldId = localStorage.getItem("selectedFieldId"); // Get the selected field ID
    const duration = document.getElementById("duration").value;
    const bookingDate = document.getElementById("date").value; // Ensure you get the value of the booking date from the form

    if (!token) {
        alert("❌ Unauthorized! Please log in.");
        window.location.href = "login.html"; // Redirect to login if not logged in
        return;
    }

    try {
        const response = await fetch("http://localhost:5001/api/bookings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
                field_id: fieldId,
                duration: duration,
                booking_date: bookingDate // Send the booking date here
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert("✅ Booking successful!");
            // Enable the "Next" button after successful booking submission
            document.getElementById("next-btn").disabled = false;
        } else {
            alert(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

// ✅ Handle the "Next" Button Click
document.getElementById("next-btn")?.addEventListener("click", () => {
    // Redirect to the payment page after booking is successful
    window.location.href = "payment.html";
});

// ✅ Handle the "Next" Button Initially Disabled
function handleNextButton() {
    const nextButton = document.getElementById("next-btn");
    nextButton.disabled = true; // Initially disable the "Next" button

    // Enable "Next" button after booking submission
    document.getElementById("booking-form")?.addEventListener("submit", () => {
        nextButton.disabled = false; // Enable after successful booking
    });
}

// ✅ Check if Customer Already Has a Membership
async function checkCustomerMembership() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("❌ Unauthorized! Please log in.");
        window.location.href = "login.html"; // Redirect to login if not logged in
        return;
    }

    try {
        const response = await fetch("http://localhost:5001/api/memberships/my-membership", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });

        const data = await response.json();
        if (response.ok && data.length > 0) {
            // User has an active membership
            const activeMembership = data[0]; // Assuming the active membership is the first entry

            const joinButtons = document.querySelectorAll(".membership-plan button");

            joinButtons.forEach(button => {
                if (activeMembership.type === "monthly" && button.textContent.includes("Monthly")) {
                    button.textContent = "Already Purchased";
                    button.disabled = true; // Disable the button to prevent further purchases
                } else if (activeMembership.type === "yearly" && button.textContent.includes("Yearly")) {
                    button.textContent = "Already Purchased";
                    button.disabled = true; // Disable the button to prevent further purchases
                }
            });
        }
    } catch (error) {
        console.error("Error fetching membership:", error);
    }
}

// ✅ Handle Membership Plan Purchase (Join Monthly or Yearly)
async function joinMembership(type) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("❌ Unauthorized! Please log in.");
        window.location.href = "login.html"; // Redirect to login if not logged in
        return;
    }

    try {
        const response = await fetch("http://localhost:5001/api/memberships", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ type }) // Monthly or Yearly
        });

        const data = await response.json();
        if (response.ok) {
            alert("✅ Membership purchased successfully!");
            // Update the button text to "Already Purchased"
            const button = document.querySelector(`.membership-plan button:contains('${type === "monthly" ? "Monthly" : "Yearly"}')`);
            if (button) {
                button.textContent = "Already Purchased";
                button.disabled = true; // Disable the button
            }
        } else {
            alert(`❌ Error: ${data.error}`);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// ✅ Fetch Fields data
async function loadFields() {
    try {
        const response = await fetch("http://localhost:5001/api/fields");
        const fields = await response.json();

        if (response.ok) {
            const fieldsContainer = document.getElementById("fields");
            fieldsContainer.innerHTML = ""; // Clear previous content before appending new

            fields.forEach(field => {
                const fieldCard = document.createElement("div");
                fieldCard.classList.add("field-card");

                // Add the HTML structure for each field dynamically
                fieldCard.innerHTML = `
                    <div class="field-image">
                        <img src="../${field.image_path}" alt="${field.field_name}" class="field-image" loading="lazy" />
                    </div>
                    <div class="field-info">
                        <h2>${field.field_name}</h2>
                        <p>Location: ${field.field_location || 'Not available'}</p>
                        <p>Type: ${field.field_type || 'Not available'}</p>
                        <div class="field-details">
                            <p>Price: ฿${field.hourly_rate}/hr</p>
                            <p>Status: ${field.field_status}</p>
                        </div>
                        <button class="book-now" aria-label="Book ${field.field_name} now">Book Now</button>
                    </div>
                `;

                // Store field_id in localStorage when user clicks the "Book Now" button
                fieldCard.querySelector(".book-now").addEventListener("click", () => {
                    localStorage.setItem("selectedFieldId", field.field_id); // Save field id
                    window.location.href = "booking_form.html"; // Redirect to booking form
                });

                fieldsContainer.appendChild(fieldCard); // Append the new field card to the container
            });
        } else {
            alert("❌ Error fetching facilities data.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("❌ An error occurred while fetching fields data.");
    }
}

// ✅ Handle Customer Login (Fix)
function setupLogin() {
    const loginForm = document.getElementById("login-form");
    if (!loginForm) return;

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            const response = await fetch("http://localhost:5001/api/auth/customer/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log("Login Response:", data); // ✅ Debugging

            if (!response.ok) {
                alert(`❌ Login failed: ${data.message}`);
                return;
            }

            // ✅ Store token & user data in localStorage
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            alert("✅ Login successful!");

            // ✅ Redirect to home page
            window.location.href = "index.html"; // Ensure this is the right path

        } catch (error) {
            console.error("Login Error:", error);
            alert("❌ Server Error! Try again.");
        }
    });
}

// ✅ Update Navbar Based on Login Status
function updateNavbar() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    const navButtons = document.querySelector(".nav-buttons");
    const navProfile = document.querySelector(".nav-profile");
    const userNameSpan = document.getElementById("user-name");
    const logoutButton = document.getElementById("logout-btn");

    // ✅ Check if elements exist before modifying them
    if (!navButtons || !navProfile || !userNameSpan || !logoutButton) {
        console.error("❌ Navbar elements missing in DOM");
        return;
    }

    if (token && user) {
        navButtons.style.display = "none"; // Hide Log In / Sign Up
        navProfile.style.display = "flex"; // Show profile section
        userNameSpan.textContent = user.name; // Display the user's name

        // ✅ Redirect to profile page when clicking on name
        userNameSpan.onclick = () => {
            window.location.href = "customer_profile.html";
        };

        // ✅ Logout Functionality
        logoutButton.onclick = () => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            alert("✅ Logged out successfully!");
            window.location.href = "index.html";
        };

    } else {
        navButtons.style.display = "flex"; // Show Log In / Sign Up
        navProfile.style.display = "none"; // Hide profile section
    }
}

// ✅ Fetch Customer Profile Data
async function loadProfileData() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("❌ Unauthorized! Please log in.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:5001/api/customers/me", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById("customer-name").textContent = data.customer_name;
            document.getElementById("customer-email").textContent = data.customer_email;
            document.getElementById("customer-phone").textContent = data.customer_phone;

            // ✅ Store customer ID for later updates
            const customerId = data.customer_id;

            document.getElementById("update-profile-form")?.addEventListener("submit", async (e) => {
                e.preventDefault();
                
                const newName = document.getElementById("new-name").value.trim();
                const newPhone = document.getElementById("new-phone").value.trim();

                const updateData = {};
                if (newName) updateData.customer_name = newName;
                if (newPhone) updateData.customer_phone = newPhone;

                if (Object.keys(updateData).length === 0) {
                    alert("❌ No changes detected.");
                    return;
                }

                try {
                    const updateResponse = await fetch(`http://localhost:5001/api/customers/${customerId}`, {  // ✅ Use customer ID
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        },
                        body: JSON.stringify(updateData),
                    });

                    const updateDataRes = await updateResponse.json();
                    if (updateResponse.ok) {
                        alert("✅ Profile updated successfully!");
                        if (newName) document.getElementById("customer-name").textContent = newName;
                        if (newPhone) document.getElementById("customer-phone").textContent = newPhone;
                    } else {
                        alert(`❌ Error updating profile: ${updateDataRes.error}`);
                    }
                } catch (error) {
                    console.error("Error:", error);
                    alert("❌ Server error. Try again later.");
                }
            });

        } else {
            alert("❌ Error fetching profile.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// ✅ Fetch Customer Bookings
async function fetchBookings() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch("http://localhost:5001/api/bookings/my-bookings", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });

        const data = await response.json();
        if (response.ok) {
            const bookingList = document.getElementById("booking-list");
            bookingList.innerHTML = ""; // Clear previous entries

            data.forEach((booking) => {
                // Format the booking date to show only date (without time)
                const bookingDate = new Date(booking.booking_date).toLocaleDateString();

                const bookingItem = document.createElement("li");
                bookingItem.textContent = `📅 ${bookingDate} | ${booking.field_name} | ${booking.duration} hours | Status: ${booking.status}`;
                bookingList.appendChild(bookingItem);
            });
        } else {
            alert("❌ Error fetching bookings.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// ✅ Fetch Customer Membership
async function fetchMembership() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch("http://localhost:5001/api/memberships/my-membership", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });

        const data = await response.json();
        if (response.ok && data.length > 0) {
            document.getElementById("membership-type").textContent = data[0].type;
            document.getElementById("membership-status").textContent = data[0].membership_status;
            document.getElementById("membership-expiry").textContent = data[0].expiry_date;
        } else {
            document.getElementById("membership-type").textContent = "No Active Membership";
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// ✅ Handle Customer Signup
function setupSignup() {
    const signupForm = document.getElementById("signup-form");
    if (!signupForm) return;

    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("customer-name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            const response = await fetch("http://localhost:5001/api/auth/customer/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customer_name: name, customer_email: email, customer_phone: phone, customer_password: password })
            });

            const data = await response.json();
            if (response.ok) {
                alert("✅ Signup successful! You can now log in.");
                window.location.href = "login.html";
            } else {
                alert(`❌ Signup failed: ${data.error}`);
            }
        } catch (error) {
            console.error("Signup Error:", error);
        }
    });
}

// ✅ Define the function BEFORE using it
async function loadCustomerSchedule() {
    const scheduleTable = document.querySelector("#schedule tbody");

    console.log("Fetching customer schedule..."); // ✅ Debugging

    try {
        const response = await fetch("http://localhost:5001/api/schedule");
        const trainerSchedule = await response.json();

        console.log("Customer Schedule Data:", trainerSchedule); // ✅ Debugging

        if (!response.ok) {
            alert("❌ Error fetching schedule.");
            return;
        }

        // ✅ Define days & get unique trainer names
        const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const trainers = [...new Set(trainerSchedule.map(s => s.trainer_name))];

        // ✅ Clear table before populating
        scheduleTable.innerHTML = "";

        // ✅ Generate rows for each day
        daysOfWeek.forEach(day => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${day}</td>`;

            trainers.forEach(trainerName => {
                const scheduleEntry = trainerSchedule.find(s => s.trainer_name === trainerName && s.day_of_week === day);
                const status = scheduleEntry && scheduleEntry.is_available ? "✅ Available" : "❌ Unavailable";
                row.innerHTML += `<td>${status}</td>`;
            });

            scheduleTable.appendChild(row);
        });

    } catch (error) {
        console.error("❌ Error loading customer schedule:", error);
    }
}

// ✅ Handle Feedback Form Submission
async function feedbackFormReady() {
    document.getElementById("feedback-form").addEventListener("submit", async function (e) {
        e.preventDefault(); // Prevent default form submission

        // ✅ Extract customer data from localStorage
        const userData = JSON.parse(localStorage.getItem("user"));
        if (!userData || !userData.id) {
            alert("❌ You must be logged in to submit feedback.");
            return;
        }

        const customerId = userData.id; // ✅ Extract correct customer ID
        const feedbackText = document.getElementById("feedback-message").value.trim();

        if (!feedbackText) {
            alert("❌ Feedback cannot be empty.");
            return;
        }

        const feedbackData = {
            customer_id: customerId,
            feedback_text: feedbackText,
        };

        try {
            const response = await fetch("http://localhost:5001/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(feedbackData),
            });

            const data = await response.json();

            if (response.ok) {
                alert("✅ Feedback submitted successfully!");
                document.getElementById("feedback-form").reset();
            } else {
                alert(`❌ Error submitting feedback: ${data.error}`);
            }
        } catch (error) {
            console.error("❌ Error submitting feedback:", error);
        }
    });

}

// Add smooth scrolling for anchor links
function addSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const targetId = this.getAttribute("href").substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: "smooth",
                });
            }
        });
    });
}