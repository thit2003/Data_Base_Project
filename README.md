# Data_Base_Project
# 🏋️‍♂️ ActiveHeaven - Full Stack Website

ActiveHeaven is a **sports booking management system** that allows users to book fields, manage memberships, schedule trainer sessions, and track payments. This project includes both **frontend (HTML, CSS, JavaScript)** and **backend (Node.js, Express.js, PostgreSQL)**.
This project is not ready for deployment but can check on localhost://.

## 📌 Features
This project is divided into three roles: **Admin, Customers, and Trainers**.

### **👨‍💼 Admin Can:**
✅ **Manage Users** (Admins, Trainers, Customers)  
✅ **View Dashboard Metrics** (Revenue, Memberships, Bookings, Active Trainers)  
✅ **Approve & Manage Bookings**  
✅ **Manage Field Schedules** (Assign trainer schedules)  
✅ **Handle Payments & Approve Transactions**  
✅ **View & Respond to Customer Feedback**  

### **👤 Customers Can:**
✅ **Register/Login & Manage Their Profile**  
✅ **Book Sports Fields & Make Payments**  
✅ **Subscribe to Monthly/Yearly Memberships**  
✅ **View Their Booking & Payment History**  
✅ **Provide Feedback for Trainers & Services**  

### **🏋️ Trainers Can:**
✅ **Login & View Their Profile**  
✅ **Check Their Assigned Work Schedules**  
✅ **View Customer Feedback on Their Training**  

---

## 🚀 Getting Started

### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/your-username/ActiveHeaven.git](https://github.com/Kinosaur/FinalDataBaseProject.git

cd FinalDataBaseProject
cd backend
```

### **2️⃣ Install Dependencies**
Make sure you have [Node.js](https://nodejs.org/) installed. Then run:
```sh
npm install
```
Or You can do like me, I install [nvm - node version manager](https://github.com/nvm-sh/nvm). Follow the guideline from there, install lts version node via nvm. After finished all then run:
```sh
nvm use node
npm install
```

### **3️⃣ Set Up Environment Variables**
Create a `.env` file in the root directory and add:
```env
DB_USER=your_db_user
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
DB_PORT=your_db_port
PORT=5001
JWT_SECRET=your_secret_key
```

---

## 🛠️ Running the Server

### **Development Mode**
Runs with **nodemon** (auto-restart on changes):
```sh
npm run dev
```

### **Production Mode**
```sh
npm start
```

## 🐘 Set up databse (PostgreSQL)
Copy the SQL command from inside backend folder [finalproj_sec544_group4.sql](https://github.com/Kinosaur/FinalDataBaseProject/blob/main/backend/finalproj_sec544_group_4.sql)

## 🌍 API Endpoints

### **🛡️ Authentication**
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST   | `/api/auth/admin/login` | Admin login |
| POST   | `/api/auth/trainer/login` | Trainer login |
| POST   | `/api/auth/customer/login` | Customer login |
| POST   | `/api/auth/customer/register` | Register new customer |

### **👨‍💼 Admin API**
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET    | `/api/admin/dashboard` | Fetch key metrics |
| GET    | `/api/admin/me` | Get logged-in admin profile |
| POST   | `/api/admin` | Create a new admin |
| PUT    | `/api/admin/:id` | Update admin details |
| DELETE | `/api/admin/:id` | Delete an admin |

### **📅 Booking API**
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST   | `/api/bookings` | Create a new booking |
| GET    | `/api/bookings/my-bookings` | View logged-in user's bookings |
| GET    | `/api/bookings` | Admin fetches all bookings |
| PUT    | `/api/bookings/:id/status` | Admin updates booking status |
| DELETE | `/api/bookings/:id` | Customer cancels their booking |

### **🧑‍💻 Customer API**
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET    | `/api/customers` | Admin fetches all customers |
| GET    | `/api/customers/me` | Get logged-in customer profile |
| POST   | `/api/customers` | Register a new customer |
| PUT    | `/api/customers/:id` | Update customer details |
| DELETE | `/api/customers/:id` | Admin deletes a customer |

### **📝 Feedback API**
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET    | `/api/feedback` | Fetch all feedback (Admin) |
| POST   | `/api/feedback` | Customers submit feedback |
| PUT    | `/api/feedback/:id` | Update feedback status |
| DELETE | `/api/feedback/:id` | Delete feedback |

### **⚽ Field API**
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET    | `/api/fields` | Fetch all fields |
| GET    | `/api/fields/:id` | Fetch a single field |
| POST   | `/api/fields` | Admin creates a new field |
| PUT    | `/api/fields/:id` | Admin updates a field |
| DELETE | `/api/fields/:id` | Admin deletes a field |

### **🏅 Membership API**
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST   | `/api/memberships` | Customer purchases a membership |
| GET    | `/api/memberships/my-membership` | View customer membership |
| GET    | `/api/memberships` | Admin fetches all memberships |
| DELETE | `/api/memberships/:id` | Admin cancels a membership |

### **💰 Payment API**
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST   | `/api/payments` | Make a payment (Booking/Membership) |
| GET    | `/api/payments/my-payments` | View logged-in user's payments |
| GET    | `/api/payments` | Admin fetches all payments |
| PUT    | `/api/payments/:id/status` | Admin updates payment status |

### **📅 Schedule API**
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET    | `/api/schedule` | Fetch trainer schedule (Public) |
| POST   | `/api/schedule` | Admin updates the schedule |

### **🏋️ Trainer API**
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET    | `/api/trainers` | Admin fetches all trainers |
| GET    | `/api/trainers/schedule` | Fetch logged-in trainer's schedule |
| GET    | `/api/trainers/feedback` | Fetch trainer-related feedback |
| POST   | `/api/trainers` | Admin creates a new trainer |
| DELETE | `/api/trainers/:id` | Admin deletes a trainer |

---

## 📦 Dependencies
```json
{
  "bcryptjs": "^2.4.3",
  "body-parser": "^1.20.3",
  "cors": "^2.8.5",
  "dotenv": "^16.4.7",
  "express": "^4.21.2",
  "jsonwebtoken": "^9.0.2",
  "pg": "^8.13.1"
}
```
**Development Dependencies:**
```json
{
  "nodemon": "^3.1.9"
}
```

---

## 👨‍💻 About Us

👋 **Hello, I'm Kaung Khant Lin aka Kino!**  
We are **Computer Science students at Assumption University of Thailand** with a passion for **frontend, backend development, and database management**. This project is part of our learning journey, applying **Express.js, PostgreSQL, and JWT authentication**.

🔗 **Connect with me:**
- GitHub: [@Kinosaur](https://github.com/Kinosaur)
- LinkedIn: [Kaung Khant Lin](https://www.linkedin.com/in/kaung-khant-lin-33a477274/)
- Email: kaungkhantlin999@gmail.com

---

## 👨‍💻 Contributors
This project was built by **three contributors**:
- 👤 **[@Kinosaur](https://github.com/Kinosaur)** - **Kinosaur Kino**  
- 👤 **[@KnoxHasGF](https://github.com/KnoxHasGF)** - **KnoxHasGF**  
- 👤 **[@thit2003](https://github.com/thit2003)** - **John**  

Thank you to my teammates for their contributions!

---

## 📜 License
This project is licensed under the **MIT License**. Feel free to use and modify it for your own projects!
