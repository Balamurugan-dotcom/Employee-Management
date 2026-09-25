# TalentFlow EMS - Enterprise Employee Management System

A modern full-stack MERN (MongoDB, Express, React, Node.js) Employee Management System designed with role-based access control for Admins, Managers, and Employees.

---

## 🌟 Key Features

### 👑 Admin Portal
- **Enterprise Dashboard**: Overview metrics for active workforce, departmental distribution, payroll budget, and attendance ratios.
- **Employee Directory**: Add, edit, view, filter, and manage employees across departments.
- **Manager Management**: Dedicated management for managerial staff with department mapping.
- **Attendance & Leave Management**: Complete tracking of daily punches, monthly records, and leave requests.
- **Payroll System**: Automated salary computations, allowances, deductions, and payslip generation.
- **Project & Task Delegation**: Create enterprise projects and assign milestones to teams.

### 👔 Manager Portal
- **Team Workspace**: Real-time visibility into direct reports.
- **Task Assignment & Review**: Assign tasks with priorities, due dates, and attach feedback notes.
- **Attendance & Approvals**: Monitor daily team attendance and approve or reject leave requests.

### 💼 Employee Portal
- **Self-Service Productivity**: Real-time punch-in/out attendance with working hour calculation.
- **Monthly Attendance Records**: View historical attendance logs by month.
- **Task Dashboard**: Interactive assigned tasks with progress updates (`Pending`, `In Progress`, `Completed`) and full-detail modals.
- **Leave Application**: Submit leave requests with status tracking.
- **Digital Payslips**: View and download itemized monthly payslips.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide React, Modern CSS System
- **Backend**: Node.js, Express.js, MongoDB Atlas with Mongoose
- **Authentication**: JWT (JSON Web Tokens) with secure password hashing (`bcryptjs`)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Balamurugan-dotcom/Employee-Management.git
cd Employee-Management
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory using `.env.example` as a template:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```
Start backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Access the application at `http://localhost:5173`.
