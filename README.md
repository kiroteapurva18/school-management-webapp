# School Management System

Full-stack School Management System with role-based access for admin, teacher, student, and parent.

## Tech Stack

- Frontend: React (Vite), Tailwind CSS, Axios
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Auth: JWT

## Project Structure

```
.
|-- backend
|   |-- config
|   |   `-- db.js
|   |-- controllers
|   |   |-- assignmentController.js
|   |   |-- attendanceController.js
|   |   |-- authController.js
|   |   |-- studentController.js
|   |   `-- teacherController.js
|   |-- middleware
|   |   |-- authMiddleware.js
|   |   |-- errorMiddleware.js
|   |   `-- validateObjectId.js
|   |-- models
|   |   |-- Assignment.js
|   |   |-- Attendance.js
|   |   |-- Student.js
|   |   |-- Teacher.js
|   |   `-- User.js
|   |-- routes
|   |   |-- assignmentRoutes.js
|   |   |-- attendanceRoutes.js
|   |   |-- authRoutes.js
|   |   |-- studentRoutes.js
|   |   `-- teacherRoutes.js
|   |-- .env.example
|   |-- package.json
|   |-- server.js
|   `-- utils
|       `-- asyncHandler.js
`-- frontend
    |-- src
    |   |-- components
    |   |   |-- Navbar.jsx
    |   |   `-- ProtectedRoute.jsx
    |   |-- context
    |   |   `-- AuthContext.jsx
    |   |-- hooks
    |   |   `-- useAuth.js
    |   |-- pages
    |   |   |-- AssignmentsPage.jsx
    |   |   |-- AttendancePage.jsx
    |   |   |-- DashboardPage.jsx
    |   |   |-- LoginPage.jsx
    |   |   |-- RegisterPage.jsx
    |   |   |-- StudentsPage.jsx
    |   |   `-- TeachersPage.jsx
    |   |-- services
    |   |   `-- api.js
    |   |-- App.jsx
    |   |-- index.css
    |   `-- main.jsx
    |-- .env.example
    |-- index.html
    |-- package.json
    |-- postcss.config.js
    |-- tailwind.config.js
    `-- vite.config.js
```

## Setup Instructions

### 1) Backend setup

```bash
cd backend
npm install
copy .env.example .env
```

Update `.env` values as needed, then run:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.

### 2) Frontend setup

Open another terminal:

```bash
cd frontend
npm install
copy .env.example .env
```

Run:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Environment Variables

### backend/.env

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/school_db
JWT_SECRET=replace_with_long_random_secret
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
```

### frontend/.env

```env
VITE_API_URL=http://localhost:5000/api
```
