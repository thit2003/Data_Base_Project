document.addEventListener("DOMContentLoaded", () => {

    // Page-specific initialization
    const currentPageDataset = document.body.dataset.page;

    if (currentPageDataset === "login") {
        initializeTrainerLoginPage();
    } else if (currentPageDataset === "trainer_dashboard") {
        initializeTrainerDashboard();
    }
});


function initializeTrainerLoginPage() {
    const loginForm = document.getElementById("login-form");

    if (!loginForm) return; // Exit if login form is not present on the page

    // ✅ Handle Trainer Login Submission
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault(); // Prevent default form submission

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            alert("❌ Email and password are required.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5001/api/auth/trainer/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("✅ Login successful!");

                // ✅ Store token & user data in localStorage
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                // ✅ Redirect to trainer dashboard
                window.location.href = "trainer_dashboard.html";
            } else {
                alert(`❌ Login failed: ${data.message}`);
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("❌ Server error! Try again.");
        }
    });
}

async function initializeTrainerDashboard() {
    const scheduleTableBody = document.querySelector("#scheduleTable tbody");
    const feedbackTableBody = document.querySelector("#feedbackTable tbody");
    const userNameDisplay = document.getElementById("user-name");
    const logoutBtn = document.getElementById("logout-btn");

    // ✅ Get trainer data from localStorage
    const trainerData = JSON.parse(localStorage.getItem("user"));
    if (!trainerData) {
        alert("❌ Unauthorized! Please log in.");
        window.location.href = "trainer_login.html"; // Redirect if not logged in
        return;
    }

    userNameDisplay.textContent = trainerData.name; // Display trainer name

    // ✅ Fetch Trainer's Schedule
    async function fetchTrainerSchedule() {
        try {
            const response = await fetch("http://localhost:5001/api/trainers/schedule", {
                method: "GET",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });

            const schedule = await response.json();

            if (!response.ok) {
                alert("❌ Error fetching schedule.");
                return;
            }

            scheduleTableBody.innerHTML = ""; // Clear table before adding new data

            schedule.forEach(entry => {
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${entry.day_of_week}</td>
                    <td class="${entry.is_available ? "scheduled" : "off-day"}">
                        ${entry.is_available ? "🏋️ Scheduled" : "🏖 Off Day"}
                    </td>
                `;

                scheduleTableBody.appendChild(row);
            });
        } catch (error) {
            console.error("❌ Error loading schedule:", error);
        }
    }

    // ✅ Fetch Trainer's Approved Feedback
    async function fetchTrainerFeedback() {
        try {
            const response = await fetch("http://localhost:5001/api/trainers/feedback", {
                method: "GET",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });

            const feedbackData = await response.json();

            if (!response.ok) {
                alert("❌ Error fetching feedback.");
                return;
            }

            feedbackTableBody.innerHTML = ""; // Clear previous feedback

            if (feedbackData.length === 0) {
                feedbackTableBody.innerHTML = `<tr><td colspan="3">No approved feedback available.</td></tr>`;
                return;
            }

            feedbackData.forEach(entry => {
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${entry.feedback_text}</td>
                    <td>${new Date(entry.feedback_date).toLocaleDateString()}</td>
                `;

                feedbackTableBody.appendChild(row);
            });
        } catch (error) {
            console.error("❌ Error loading feedback:", error);
        }
    }

    // ✅ Logout Functionality
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("✅ Logged out successfully!");
        window.location.href = "login.html"; // Redirect to login
    });

    // ✅ Initial Fetch
    fetchTrainerSchedule();
    fetchTrainerFeedback();
}
