// Select sidebar and main content elements
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const toggler = document.querySelector('.sidebar-toggler');

// Toggle sidebar and adjust main content margin
if (toggler) {
    toggler.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        if (sidebar.classList.contains('collapsed')) {
            mainContent.style.marginLeft = '115px'; // Adjust to collapsed width
        } else {
            mainContent.style.marginLeft = '300px'; // Adjust to expanded width
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {

    // Sidebar navigation highlight
    const links = document.querySelectorAll(".sidebar-nav .nav-link");
    const currentPage = window.location.pathname.split("/").pop().split(".")[0]; // Extracts the page name

    links.forEach((link) => {
        if (link.dataset.page === currentPage) {
            link.classList.add("active");
        }
    });

    // Page-specific initialization
    const currentPageDataset = document.body.dataset.page;
    if (currentPageDataset === "bookings") {
        initializeBookingsPage();
    } else if (currentPageDataset === "fields") {
        initializeFieldsPage();
    } else if (currentPageDataset === "customers") {
        initializeCustomersPage();
    } else if (currentPageDataset === "trainers") {
        initializeTrainersPage();
    } else if (currentPageDataset === "dashboard") {
        initializeAdminDashboard();
    } else if (currentPageDataset === "schedule") {
        initializeSchedulePage();
    } else if (currentPageDataset === "feedbacks") {
        initializeFeedbackPage();
    } else if (currentPageDataset === "admins") {
        initializeAdminProfilePage();
    } else if (currentPageDataset === "payments") {
        initializePaymentsPage();
    }

    // Handle login logic if on admin_login.html
    const path = window.location.pathname.split("/").pop();
    if (path === "admin_login.html") {
        setupAdminLogin();
    }

    // Handle logout
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", (e) => {
            e.preventDefault();
            // Remove the token and user data from localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            // Alert the user that they have logged out
            alert("✅ You have successfully logged out.");
            // Redirect to the login page
            window.location.href = "admin_login.html"; // Redirect to admin login page
        });
    }
});

// ✅ Admin Login Function
async function setupAdminLogin() {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent form from refreshing the page

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            const response = await fetch("http://localhost:5001/api/auth/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(`❌ Login failed: ${data.message}`);
                return;
            }

            // Store the token in localStorage
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            alert("✅ Admin Login successful!");
            window.location.href = "dashboard.html"; // Redirect to the admin dashboard page

        } catch (error) {
            console.error("Login Error:", error);
            alert("❌ Server Error! Try again.");
        }
    });
}

async function initializeAdminDashboard() {
    const revenueCard = document.querySelector(".card:nth-child(1)");
    const membershipsCard = document.querySelector(".card:nth-child(2)");
    const bookingsCard = document.querySelector(".card:nth-child(3)");
    const trainersCard = document.querySelector(".card:nth-child(4)");
    const bookingTableBody = document.getElementById("booking-table");

    try {
        const response = await fetch("http://localhost:5001/api/admins/dashboard", {
            method: "GET",
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        });

        const data = await response.json();

        if (!response.ok) {
            alert("❌ Error fetching dashboard data.");
            return;
        }

        // ✅ Update Key Metrics
        revenueCard.textContent = `Total Revenue: $${parseFloat(data.total_revenue).toFixed(2)}`;
        membershipsCard.textContent = `Active Memberships: ${data.active_memberships}`;
        bookingsCard.textContent = `Total Bookings: ${data.total_bookings}`;
        trainersCard.textContent = `Active Trainers: ${data.active_trainers}`;

        // ✅ Populate Latest Bookings Table
        bookingTableBody.innerHTML = "";
        data.latest_bookings.forEach(booking => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${booking.customer_name}</td>
                <td>${booking.field_name}</td>
                <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
                <td>${booking.status}</td>
            `;

            bookingTableBody.appendChild(row);
        });

        // ✅ Generate Membership Chart
        generateMembershipChart(data.membership_distribution);

        // ✅ Generate Field Usage Chart
        generateFieldUsageChart(data.field_usage);

    } catch (error) {
        console.error("❌ Error loading dashboard:", error);
    }
}

// ✅ Generate Membership Distribution Chart
function generateMembershipChart(membershipData) {
    const ctx = document.getElementById("membershipChart").getContext("2d");

    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: membershipData.map(m => m.type),
            datasets: [{
                data: membershipData.map(m => m.count),
                backgroundColor: [
                    "#4169E1", // Royal Blue
                    "#3CB371", // Soft Green
                    "#FFD700", // Golden Yellow
                    "#FF8C00", // Deep Orange
                    "#008080", // Teal
                    "#6A5ACD", // Dark Purple
                    "#DC143C"  // Crimson Red
                ],
            }]
        },
        options: {
            responsive: true
        }
    });
}

// ✅ Generate Field Usage Chart
function generateFieldUsageChart(fieldUsageData) {
    const ctx = document.getElementById("fieldUsageChart").getContext("2d");

    // ✅ Define colors dynamically for each field
    const colors = [
        "#4169E1", "#3CB371", "#FFD700", "#FF8C00", "#008080", 
        "#6A5ACD", "#DC143C", "#FF69B4", "#20B2AA", "#8A2BE2"
    ];

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: fieldUsageData.map(f => f.field_name), // ✅ Use field names for x-axis labels
            datasets: [{
                label: "Bookings Per Field",
                data: fieldUsageData.map(f => f.usage_count),
                backgroundColor: fieldUsageData.map((_, index) => colors[index % colors.length]), // ✅ Unique color per field
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }, // ✅ Hide duplicate legends
            }
        }
    });
}

// ✅ Field Page Logic
async function initializeFieldsPage() {
    let selectedField = null;
    const tableBody = document.querySelector("#fieldsTable tbody");
    const fieldModal = document.getElementById("fieldModal");
    const fieldCloseModal = document.querySelector("#fieldModal .close");

    const addFieldBtn = document.getElementById("addBtn");
    const updateFieldBtn = document.getElementById("updateBtn");
    const deleteFieldBtn = document.getElementById("deleteBtn");

    // ✅ Fetch Fields and Populate Table
    async function fetchFields() {
        try {
            const response = await fetch("http://localhost:5001/api/fields", {
                method: "GET",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });

            const fields = await response.json();
            if (response.ok) {
                populateFieldsTable(fields);
            } else {
                alert("❌ Error fetching fields.");
            }
        } catch (error) {
            console.error("Error fetching fields:", error);
        }
    }

    // ✅ Populate Fields Table
    function populateFieldsTable(fields) {
        tableBody.innerHTML = ""; // Clear existing table rows

        fields.forEach((field) => {
            const row = document.createElement("tr");
            row.dataset.fieldId = field.field_id;

            row.innerHTML = `
                <td>${field.field_id}</td>
                <td>${field.field_name}</td>
                <td>${field.field_type}</td>
                <td>${field.field_location || "N/A"}</td>
                <td>${field.field_status}</td>
                <td>฿${field.hourly_rate}/hr</td>
            `;

            row.addEventListener("click", () => selectField(row, field));
            tableBody.appendChild(row);
        });
    }

    // ✅ Selecting & Unselecting a Field (Toggle Selection)
    function selectField(row, field) {
        if (selectedField && selectedField.field_id === field.field_id) {
            row.classList.remove("selected");
            selectedField = null;

            // Disable buttons
            updateFieldBtn.disabled = true;
            deleteFieldBtn.disabled = true;
        } else {
            // Deselect any previously selected row
            document.querySelectorAll("#fieldsTable tbody tr").forEach(tr => tr.classList.remove("selected"));

            // Select the clicked row
            row.classList.add("selected");
            selectedField = field;

            // Enable buttons
            updateFieldBtn.disabled = false;
            deleteFieldBtn.disabled = false;
        }
    }

    // ✅ Open Field Modal
    function openFieldModal(editMode = false) {
        console.log("Modal form triggered!");
        fieldModal.style.display = "block";

        document.getElementById("modal-title").textContent = editMode ? "Update Field" : "Add Field";
        document.getElementById("saveFieldBtn").textContent = editMode ? "Update" : "Save";

        if (editMode && selectedField) {
            document.getElementById("field-id").value = selectedField.field_id;
            document.getElementById("field-name").value = selectedField.field_name;
            document.getElementById("field-type").value = selectedField.field_type;
            document.getElementById("field-location").value = selectedField.field_location;
            document.getElementById("hourly-rate").value = selectedField.hourly_rate;
            document.getElementById("field-status").value = selectedField.field_status;
            document.getElementById("image-path").value = selectedField.image_path;
        } else {
            // Clear form if adding new field
            document.getElementById("fieldForm").reset();
        }
    }

    // ✅ Close Modal
    fieldCloseModal.addEventListener("click", () => {
        fieldModal.style.display = "none";
    });

    // ✅ Handle Field Form Submission (Add / Update)
    document.getElementById("fieldForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const fieldId = document.getElementById("field-id").value;
        const method = fieldId ? "PUT" : "POST";
        const url = fieldId ? `http://localhost:5001/api/fields/${fieldId}` : "http://localhost:5001/api/fields";

        const fieldData = {
            field_name: document.getElementById("field-name").value,
            field_type: document.getElementById("field-type").value,
            field_location: document.getElementById("field-location").value,
            hourly_rate: document.getElementById("hourly-rate").value,
            field_status: document.getElementById("field-status").value,
            image_path: document.getElementById("image-path").value,
        };

        try {
            await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify(fieldData),
            });

            alert("✅ Success!");
            fieldModal.style.display = "none";
            fetchFields();
        } catch (error) {
            console.error("Error saving field:", error);
        }
    });

    // ✅ Delete Field
    deleteFieldBtn.addEventListener("click", async () => {
        if (!selectedField) return;

        const confirmDelete = confirm(`⚠️ Are you sure you want to delete "${selectedField.field_name}"?`);
        if (!confirmDelete) return;

        try {
            await fetch(`http://localhost:5001/api/fields/${selectedField.field_id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });

            alert("✅ Field deleted successfully!");
            fetchFields();
        } catch (error) {
            console.error("Error deleting field:", error);
        }
    });

    // ✅ Attach Event Listeners to Buttons
    addFieldBtn.addEventListener("click", () => openFieldModal(false));
    updateFieldBtn.addEventListener("click", () => {
        if (selectedField) openFieldModal(true);
        else alert("❌ Please select a field first.");
    });

    // ✅ Initial Fetch
    fetchFields();
}

// ✅ Initialize Bookings Page
function initializeBookingsPage() {
    fetchBookings();

    const approveBtn = document.getElementById("approveBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    let selectedBookingId = null;

    // Row selection
    document.querySelector("#bookingsTable tbody").addEventListener("click", (e) => {
        const row = e.target.closest("tr");
        if (!row) return;

        const bookingId = row.dataset.id;

        // Toggle selection
        if (selectedBookingId === bookingId) {
            row.classList.remove("selected");
            selectedBookingId = null;
            approveBtn.disabled = true;
            cancelBtn.disabled = true;
        } else {
            document.querySelectorAll("#bookingsTable tbody tr").forEach(r => r.classList.remove("selected"));
            row.classList.add("selected");
            selectedBookingId = bookingId;
            approveBtn.disabled = false;
            cancelBtn.disabled = false;
        }
    });

    // Approve booking
    approveBtn.addEventListener("click", async () => {
        if (selectedBookingId) {
            updateBookingStatus(selectedBookingId, "approved");
        }
    });

    // Cancel booking
    cancelBtn.addEventListener("click", async () => {
        if (selectedBookingId) {
            updateBookingStatus(selectedBookingId, "canceled");
        }
    });
}

// ✅ Fetch Bookings Data
async function fetchBookings() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch("http://localhost:5001/api/bookings", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });

        const data = await response.json();
        if (response.ok) {
            populateBookingsTable(data);
        } else {
            alert("❌ Error fetching bookings.");
        }
    } catch (error) {
        console.error("Error fetching bookings:", error);
    }
}

// ✅ Populate Table with Bookings
function populateBookingsTable(bookings) {
    const tbody = document.querySelector("#bookingsTable tbody");
    tbody.innerHTML = ""; // Clear previous data

    bookings.forEach(booking => {
        const row = document.createElement("tr");
        row.dataset.id = booking.booking_id;
        row.innerHTML = `
            <td>${booking.booking_id}</td>
            <td>${booking.customer_name}</td>
            <td>${booking.field_name}</td>
            <td>${booking.booking_date}</td>
            <td>${booking.duration} hours</td>
            <td>${booking.status}</td>
        `;
        tbody.appendChild(row);
    });
}

// ✅ Update Booking Status
async function updateBookingStatus(bookingId, status) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`http://localhost:5001/api/bookings/${bookingId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
        });

        if (response.ok) {
            alert(`✅ Booking ${status} successfully!`);
            fetchBookings(); // Refresh table
        } else {
            alert("❌ Error updating booking.");
        }
    } catch (error) {
        console.error("Error updating booking:", error);
    }
}

// ✅ Customer Page Logic
async function initializeCustomersPage() {
    let selectedCustomer = null;
    const tableBody = document.querySelector("#customersTable tbody");
    const customerModal = document.getElementById("customerModal");
    const customerCloseModal = document.querySelector("#customerModal .close");

    const updateCustomerBtn = document.getElementById("updateBtn");
    const deleteCustomerBtn = document.getElementById("deleteBtn");

    // ✅ Ensure Modal is Hidden on Page Load
    customerModal.style.display = "none";

    // ✅ Reset selectedCustomer on reload
    selectedCustomer = null;
    updateCustomerBtn.disabled = true; // Disable update button initially
    deleteCustomerBtn.disabled = true; // Disable delete button initially

    // ✅ Fetch Customers and Populate Table
    async function fetchCustomers() {
        try {
            const response = await fetch("http://localhost:5001/api/customers", {
                method: "GET",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });

            const customers = await response.json();
            if (response.ok) {
                populateCustomersTable(customers);
            } else {
                alert("❌ Error fetching customers.");
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    }

    // ✅ Populate Customers Table
    function populateCustomersTable(customers) {
        tableBody.innerHTML = ""; // Clear previous table rows

        customers.forEach((customer) => {
            const row = document.createElement("tr");
            row.dataset.customerId = customer.customer_id;

            row.innerHTML = `
                <td>${customer.customer_id}</td>
                <td>${customer.customer_name}</td>
                <td>${customer.customer_email}</td>
                <td>${customer.customer_phone}</td>
                <td>${customer.membership_type || "None"}</td>
                <td>${customer.membership_status || "N/A"}</td>
            `;

            row.addEventListener("click", () => selectCustomer(row, customer));
            tableBody.appendChild(row);
        });
    }

    // ✅ Selecting & Unselecting a Customer (Toggle Selection)
    function selectCustomer(row, customer) {
        if (selectedCustomer && selectedCustomer.customer_id === customer.customer_id) {
            row.classList.remove("selected");
            selectedCustomer = null;

            // Disable buttons
            updateCustomerBtn.disabled = true;
            deleteCustomerBtn.disabled = true;
        } else {
            // Deselect any previously selected row
            document.querySelectorAll("#customersTable tbody tr").forEach(tr => tr.classList.remove("selected"));

            // Select the clicked row
            row.classList.add("selected");
            selectedCustomer = customer;

            // Enable buttons
            updateCustomerBtn.disabled = false;
            deleteCustomerBtn.disabled = false;
        }
    }

    // ✅ Open Customer Modal for Update (Only When Button is Clicked)
    function openCustomerModal() {
        if (!selectedCustomer) return; // Prevent accidental opening

        console.log("Customer update modal triggered!");
        customerModal.style.display = "block";

        document.getElementById("modal-title").textContent = "Update Customer";
        document.getElementById("customer-id").value = selectedCustomer.customer_id;
        document.getElementById("customer-name").value = selectedCustomer.customer_name;
        document.getElementById("customer-email").value = selectedCustomer.customer_email;
        document.getElementById("customer-phone").value = selectedCustomer.customer_phone;
    }

    // ✅ Close Customer Modal
    customerCloseModal.addEventListener("click", () => {
        customerModal.style.display = "none";
    });

    // ✅ Update Button Click (Prevents Auto-Open)
    updateCustomerBtn.addEventListener("click", () => {
        if (selectedCustomer) {
            console.log("Update Button clicked!");
            openCustomerModal();
        } else {
            alert("❌ Please select a customer first.");
        }
    });

    // ✅ Delete Customer Functionality
    deleteCustomerBtn.addEventListener("click", async () => {
        if (!selectedCustomer) return alert("❌ Please select a customer first.");

        // const confirmDelete = confirm(`⚠️ Are you sure you want to delete "${selectedCustomer.customer_name}"?`);
        // if (!confirmDelete) return;

        try {
            const response = await fetch(`http://localhost:5001/api/customers/${selectedCustomer.customer_id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });

            if (response.ok) {
                alert("✅ Customer deleted successfully!");
                fetchCustomers(); // Refresh table
            } else {
                const errorData = await response.json();
                alert(`❌ Error deleting customer: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error deleting customer:", error);
        }
    });

    // ✅ Handle Customer Update Form Submission
    document.getElementById("customerForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const customerId = document.getElementById("customer-id").value;
        const updatedCustomerData = {
            customer_name: document.getElementById("customer-name").value,
            customer_email: document.getElementById("customer-email").value,
            customer_phone: document.getElementById("customer-phone").value,
        };

        try {
            const response = await fetch(`http://localhost:5001/api/customers/${customerId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(updatedCustomerData),
            });

            const data = await response.json();

            if (response.ok) {
                alert("✅ Customer updated successfully!");
                customerModal.style.display = "none";
                fetchCustomers(); // Refresh table
            } else {
                alert(`❌ Error updating customer: ${data.error}`);
            }
        } catch (error) {
            console.error("Error updating customer:", error);
        }
    });

    // ✅ Initial Fetch
    fetchCustomers();
}

// ✅ Trainer Page Logic
async function initializeTrainersPage() {
    let selectedTrainer = null;
    const tableBody = document.querySelector("#trainersTable tbody");
    const trainerModal = document.getElementById("trainerModal");
    const trainerCloseModal = document.querySelector("#trainerModal .close");

    const addTrainerBtn = document.getElementById("addBtn");
    const updateTrainerBtn = document.getElementById("updateBtn");
    const deleteTrainerBtn = document.getElementById("deleteBtn");

    // ✅ Ensure Modal is Hidden on Page Load
    trainerModal.style.display = "none";

    // ✅ Reset selectedTrainer on reload
    selectedTrainer = null;
    updateTrainerBtn.disabled = true;
    deleteTrainerBtn.disabled = true;

    // ✅ Fetch Trainers and Populate Table
    async function fetchTrainers() {
        try {
            const response = await fetch("http://localhost:5001/api/trainers", {
                method: "GET",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });

            const trainers = await response.json();
            if (response.ok) {
                populateTrainersTable(trainers);
            } else {
                alert("❌ Error fetching trainers.");
            }
        } catch (error) {
            console.error("Error fetching trainers:", error);
        }
    }

    // ✅ Populate Trainers Table
    function populateTrainersTable(trainers) {
        tableBody.innerHTML = "";

        trainers.forEach((trainer) => {
            const row = document.createElement("tr");
            row.dataset.trainerId = trainer.trainer_id;

            row.innerHTML = `
                <td>${trainer.trainer_id}</td>
                <td>${trainer.trainer_name}</td>
                <td>${trainer.trainer_phone}</td>
                <td>${trainer.trainer_email}</td>
            `;

            row.addEventListener("click", () => selectTrainer(row, trainer));
            tableBody.appendChild(row);
        });
    }

    // ✅ Selecting & Unselecting a Trainer (Toggle Selection)
    function selectTrainer(row, trainer) {
        if (selectedTrainer && selectedTrainer.trainer_id === trainer.trainer_id) {
            row.classList.remove("selected");
            selectedTrainer = null;
            updateTrainerBtn.disabled = true;
            deleteTrainerBtn.disabled = true;
        } else {
            document.querySelectorAll("#trainersTable tbody tr").forEach(tr => tr.classList.remove("selected"));
            row.classList.add("selected");
            selectedTrainer = trainer;
            updateTrainerBtn.disabled = false;
            deleteTrainerBtn.disabled = false;
        }
    }

    // ✅ Open Trainer Modal for Add / Update
    function openTrainerModal(editMode = false) {
        console.log("Trainer modal triggered!");
        trainerModal.style.display = "block";
        document.getElementById("modal-title").textContent = editMode ? "Update Trainer" : "Add Trainer";
        document.getElementById("saveTrainerBtn").textContent = editMode ? "Update" : "Save";

        if (editMode && selectedTrainer) {
            document.getElementById("trainer-id").value = selectedTrainer.trainer_id;
            document.getElementById("trainer-name").value = selectedTrainer.trainer_name;
            document.getElementById("trainer-email").value = selectedTrainer.trainer_email;
            document.getElementById("trainer-phone").value = selectedTrainer.trainer_phone;
            document.getElementById("trainer-password").value = ""; // Keep password field empty for updates
        } else {
            document.getElementById("trainerForm").reset();
        }
    }

    // ✅ Close Trainer Modal
    trainerCloseModal.addEventListener("click", () => {
        trainerModal.style.display = "none";
    });

    // ✅ Add Button Click (Show Modal for New Trainer)
    addTrainerBtn.addEventListener("click", () => {
        console.log("Add Button clicked!");
        openTrainerModal(false);
    });

    // ✅ Update Button Click (Show Modal for Editing Trainer)
    updateTrainerBtn.addEventListener("click", () => {
        if (selectedTrainer) {
            console.log("Update Button clicked!");
            openTrainerModal(true);
        } else {
            alert("❌ Please select a trainer first.");
        }
    });

    // ✅ Handle Trainer Form Submission (Add / Update)
    document.getElementById("trainerForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const trainerId = document.getElementById("trainer-id").value;
        const method = trainerId ? "PUT" : "POST";
        const url = trainerId ? `http://localhost:5001/api/trainers/${trainerId}` : "http://localhost:5001/api/trainers";

        const trainerData = {
            trainer_name: document.getElementById("trainer-name").value,
            trainer_email: document.getElementById("trainer-email").value,
            trainer_phone: document.getElementById("trainer-phone").value,
            trainer_password: document.getElementById("trainer-password").value.trim() || null, // Include password only when adding
        };

        if (!trainerId && !trainerData.trainer_password) {
            return alert("❌ Password is required when adding a trainer.");
        }

        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify(trainerData),
            });

            if (response.ok) {
                alert(trainerId ? "✅ Trainer updated successfully!" : "✅ Trainer added successfully!");
                trainerModal.style.display = "none";
                fetchTrainers();
            } else {
                const errorData = await response.json();
                alert(`❌ Error: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error saving trainer:", error);
        }
    });

    // ✅ Delete Trainer Functionality
    deleteTrainerBtn.addEventListener("click", async () => {
        if (!selectedTrainer) return alert("❌ Please select a trainer first.");

        const confirmDelete = confirm(`⚠️ Are you sure you want to delete "${selectedTrainer.trainer_name}"?`);
        if (!confirmDelete) return;

        try {
            const response = await fetch(`http://localhost:5001/api/trainers/${selectedTrainer.trainer_id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });

            if (response.ok) {
                alert("✅ Trainer deleted successfully!");
                fetchTrainers(); // Refresh table
            } else {
                const errorData = await response.json();
                alert(`❌ Error deleting trainer: ${errorData.error}`);
            }
        } catch (error) {
            console.error("❌ Error deleting trainer:", error);
        }
    });

    // ✅ Initial Fetch
    fetchTrainers();
}

// ✅ Schedule Page Logic
async function initializeSchedulePage() {
    const scheduleTableBody = document.getElementById("scheduleTableBody");

    let trainerSchedule = [];

    // ✅ Fetch Trainer Schedule
    async function fetchTrainerSchedule() {
        try {
            const response = await fetch("http://localhost:5001/api/schedule", {
                method: "GET",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });

            const data = await response.json();
            console.log("Schedule Data:", data); // Debugging log

            if (response.ok) {
                trainerSchedule = data;
                populateScheduleTable();
            } else {
                alert("❌ Error fetching schedule.");
            }
        } catch (error) {
            console.error("❌ Error fetching schedule:", error);
        }
    }

    // ✅ Populate Schedule Table
    function populateScheduleTable() {
        scheduleTableBody.innerHTML = "";

        const trainers = [...new Set(trainerSchedule.map(s => s.trainer_name))];

        trainers.forEach(trainerName => {
            const trainerSchedules = trainerSchedule.filter(s => s.trainer_name === trainerName);
            const row = document.createElement("tr");

            row.innerHTML = `<td>${trainerName}</td>`;

            ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].forEach(day => {
                const scheduleEntry = trainerSchedules.find(s => s.day_of_week === day);
                const isChecked = scheduleEntry ? scheduleEntry.is_available : false;

                row.innerHTML += `
                    <td>
                        <input type="checkbox" data-trainer="${trainerSchedules[0].trainer_id}" data-day="${day}" ${isChecked ? "checked" : ""}>
                    </td>
                `;
            });

            scheduleTableBody.appendChild(row);
        });
    }

    document.getElementById("saveScheduleBtn").addEventListener("click", async () => {
        const checkboxes = document.querySelectorAll("input[type='checkbox']");
        const updatedSchedule = [];

        checkboxes.forEach(checkbox => {
            updatedSchedule.push({
                trainer_id: checkbox.dataset.trainer,
                day_of_week: checkbox.dataset.day,
                is_available: checkbox.checked,
            });
        });

        try {
            const response = await fetch("http://localhost:5001/api/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify({ schedule: updatedSchedule }),
            });

            if (response.ok) {
                alert("✅ Schedule updated successfully!");
            } else {
                const errorData = await response.json();
                alert(`❌ Error updating schedule: ${errorData.error}`);
            }
        } catch (error) {
            console.error("❌ Error updating schedule:", error);
        }
    });

    // ✅ Fetch schedule on page load
    fetchTrainerSchedule();
}

// ✅ Feedback Page Logic
async function initializeFeedbackPage() {
    let selectedFeedback = null;
    const feedbackTableBody = document.querySelector("#feedbackTableBody");
    const markAddressedBtn = document.getElementById("markAddressed");
    const deleteFeedbackBtn = document.getElementById("deleteBtn");

    // ✅ Function to Format Date (YYYY-MM-DD → Readable Format)
    function formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    }

    async function loadFeedback() {
        try {
            const response = await fetch("http://localhost:5001/api/feedback", {
                method: "GET",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });

            const feedbackList = await response.json();

            if (!response.ok) {
                alert("❌ Error fetching feedback.");
                return;
            }

            feedbackTableBody.innerHTML = "";

            feedbackList.forEach(feedback => {
                const formattedDate = formatDate(feedback.feedback_date); // ✅ Format the date

                const row = document.createElement("tr");
                row.dataset.feedbackId = feedback.feedback_id;

                row.innerHTML = `
                <td>${feedback.feedback_id}</td>
                <td>${feedback.customer_name}</td>
                <td>${feedback.feedback_text}</td>
                <td>${formattedDate}</td>  <!-- ✅ Fixed date format -->
                <td>${feedback.feedback_status}</td>
            `;

                row.addEventListener("click", () => selectFeedback(row, feedback));
                feedbackTableBody.appendChild(row);
            });
        } catch (error) {
            console.error("❌ Error loading feedback:", error);
        }
    }

    // ✅ Selecting & Unselecting a Feedback Row (Toggle Selection)
    function selectFeedback(row, feedback) {
        if (selectedFeedback && selectedFeedback.feedback_id === feedback.feedback_id) {
            row.classList.remove("selected");
            selectedFeedback = null;
            markAddressedBtn.disabled = true;
            deleteFeedbackBtn.disabled = true;
        } else {
            document.querySelectorAll("#feedbackTableBody tr").forEach(tr => tr.classList.remove("selected"));
            row.classList.add("selected");
            selectedFeedback = feedback;
            markAddressedBtn.disabled = false;
            deleteFeedbackBtn.disabled = false;
        }
    }

    // ✅ Mark Selected Feedback as Addressed
    markAddressedBtn.addEventListener("click", async () => {
        if (!selectedFeedback) {
            alert("❌ Please select a feedback entry first.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5001/api/feedback/${selectedFeedback.feedback_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify({ feedback_status: "addressed" }),
            });

            if (response.ok) {
                alert("✅ Feedback marked as addressed!");
                loadFeedback(); // Refresh table
            } else {
                alert("❌ Error marking feedback as addressed.");
            }
        } catch (error) {
            console.error("❌ Error updating feedback:", error);
        }
    });

    // ✅ Delete Selected Feedback
    deleteFeedbackBtn.addEventListener("click", async () => {
        if (!selectedFeedback) {
            alert("❌ Please select a feedback entry first.");
            return;
        }

        const confirmDelete = confirm("⚠️ Are you sure you want to delete this feedback?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`http://localhost:5001/api/feedback/${selectedFeedback.feedback_id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });

            if (response.ok) {
                alert("✅ Feedback deleted successfully!");
                loadFeedback(); // Refresh table
            } else {
                alert("❌ Error deleting feedback.");
            }
        } catch (error) {
            console.error("❌ Error deleting feedback:", error);
        }
    });

    // ✅ Disable buttons initially
    markAddressedBtn.disabled = true;
    deleteFeedbackBtn.disabled = true;

    // ✅ Initial Load
    loadFeedback();
}

// ✅ Admin Profile Page Logic
async function initializeAdminProfilePage() {
    const adminProfileForm = document.getElementById("adminProfileForm");
    const currentAdminName = document.getElementById("current-admin-name");
    const currentAdminEmail = document.getElementById("current-admin-email");

    // ✅ Fetch Admin Profile
    async function loadAdminProfile() {
        try {
            const response = await fetch("http://localhost:5001/api/admins/me", {
                method: "GET",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });

            const admin = await response.json();

            if (response.ok) {
                currentAdminName.textContent = admin.admin_name;
                currentAdminEmail.textContent = admin.admin_email;

                document.getElementById("admin-name").value = admin.admin_name;
                document.getElementById("admin-email").value = admin.admin_email;
                document.getElementById("admin-phone").value = admin.admin_phone;
            } else {
                alert("❌ Error fetching admin profile.");
            }
        } catch (error) {
            console.error("❌ Error loading admin profile:", error);
        }
    }

    // ✅ Handle Admin Profile Update
    adminProfileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const updatedAdminData = {
            admin_name: document.getElementById("admin-name").value,
            admin_email: document.getElementById("admin-email").value,
            admin_phone: document.getElementById("admin-phone").value,
            admin_password: document.getElementById("admin-password").value.trim() || null, // Password optional
        };

        try {
            const response = await fetch("http://localhost:5001/api/admins/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify(updatedAdminData),
            });

            const data = await response.json();

            if (response.ok) {
                alert("✅ Profile updated successfully!");
                loadAdminProfile(); // Refresh profile data
                document.getElementById("admin-password").value = ""; // Clear password field
            } else {
                alert(`❌ Error updating profile: ${data.error}`);
            }
        } catch (error) {
            console.error("❌ Error updating profile:", error);
        }
    });

    // ✅ Load profile on page load
    loadAdminProfile();
}

// ✅ Payment Page Logic
async function initializePaymentsPage() {
    let selectedPayment = null;
    const paymentsTableBody = document.querySelector("#paymentsTable tbody");
    const approvePaymentBtn = document.getElementById("approveBtn");
    const cancelPaymentBtn = document.getElementById("cancelBtn");

    // ✅ Fetch and Populate Payments Table
    async function loadPayments() {
        try {
            const response = await fetch("http://localhost:5001/api/payments", {
                method: "GET",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });

            const payments = await response.json();

            if (!response.ok) {
                alert("❌ Error fetching payments.");
                return;
            }

            paymentsTableBody.innerHTML = "";

            payments.forEach(payment => {
                const row = document.createElement("tr");
                row.dataset.paymentId = payment.payment_id;

                row.innerHTML = `
                    <td>${payment.payment_id}</td>
                    <td>${payment.customer_name}</td>
                    <td>${payment.field_name}</td>
                    <td>${payment.membership_type}</td>
                    <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
                    <td>฿${parseFloat(payment.amount).toFixed(2)}</td>
                    <td>${payment.payment_status}</td>
                `;

                row.addEventListener("click", () => selectPayment(row, payment));
                paymentsTableBody.appendChild(row);
            });
        } catch (error) {
            console.error("❌ Error loading payments:", error);
        }
    }

    // ✅ Selecting & Unselecting a Payment Row (Toggle Selection)
    function selectPayment(row, payment) {
        if (selectedPayment && selectedPayment.payment_id === payment.payment_id) {
            row.classList.remove("selected");
            selectedPayment = null;
            approvePaymentBtn.disabled = true;
            cancelPaymentBtn.disabled = true;
        } else {
            document.querySelectorAll("#paymentsTable tbody tr").forEach(tr => tr.classList.remove("selected"));
            row.classList.add("selected");
            selectedPayment = payment;
            approvePaymentBtn.disabled = payment.payment_status === "completed"; // Disable approve if already completed
            cancelPaymentBtn.disabled = false;
        }
    }

    // ✅ Approve Payment
    approvePaymentBtn.addEventListener("click", async () => {
        if (!selectedPayment) {
            alert("❌ Please select a payment first.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5001/api/payments/${selectedPayment.payment_id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify({ status: "completed" }),
            });

            if (response.ok) {
                alert("✅ Payment approved successfully!");
                loadPayments(); // Refresh table
            } else {
                alert("❌ Error approving payment.");
            }
        } catch (error) {
            console.error("❌ Error approving payment:", error);
        }
    });

    // ✅ Cancel Payment
    cancelPaymentBtn.addEventListener("click", async () => {
        if (!selectedPayment) {
            alert("❌ Please select a payment first.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5001/api/payments/${selectedPayment.payment_id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify({ status: "failed" }),
            });

            if (response.ok) {
                alert("✅ Payment marked as failed!");
                loadPayments(); // Refresh table
            } else {
                alert("❌ Error canceling payment.");
            }
        } catch (error) {
            console.error("❌ Error canceling payment:", error);
        }
    });

    // ✅ Disable buttons initially
    approvePaymentBtn.disabled = true;
    cancelPaymentBtn.disabled = true;

    // ✅ Initial Load
    loadPayments();
}