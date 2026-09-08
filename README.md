# TaskMaster - Full-Stack Todo Application

A modern, full-stack Todo application with JWT user authentication, task management, filtering/searching, and real-time activity logging, built strictly according to the architecture specification.

## Project Structure

```
todo-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Todo.js
│   │   │   └── Activity.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── todoController.js
│   │   │   └── activityController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── todoRoutes.js
│   │   │   └── activityRoutes.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   └── server.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── TodoForm.jsx
    │   │   ├── TodoItem.jsx
    │   │   ├── TodoList.jsx
    │   │   └── ActivityList.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── Dashboard.jsx
    │   ├── services/
    │   │   ├── authService.js
    │   │   ├── todoService.js
    │   │   └── activityService.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── .env
```

---

## Getting Started

### 1. Backend Setup

1. Open a terminal and navigate to `backend`:
   ```bash
   cd C:\Users\anits\Abhi-127\todo-app\backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure MongoDB in `backend/.env`:
   - If you have MongoDB installed locally, the default is:
     ```env
     PORT=5000
     MONGO_URI=mongodb://127.0.0.1:27017/todo-app
     JWT_SECRET=supersecret_todo_app_jwt_key_2026
     ```
   - If you are using MongoDB Atlas (free cloud database), replace `MONGO_URI` with your connection string:
     ```env
     MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/todo-app?retryWrites=true&w=majority
     ```
4. Start the backend server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   The backend will run on `http://localhost:5000`.

---

### 2. Frontend Setup

1. Open a second terminal and navigate to `frontend`:
   ```bash
   cd C:\Users\anits\Abhi-127\todo-app\frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser at `http://localhost:3000` to use the application!

---

## Features

- 🔐 **Authentication**: User sign up, login, and profile verification using JSON Web Tokens (JWT) and bcrypt password encryption.
- 📋 **Task Management**: Create, view, edit, complete/uncomplete, and delete tasks.
- 🎯 **Priorities & Dates**: Assign Low, Medium, or High priorities with visual indicators, plus optional due dates with overdue notifications.
- 🔍 **Search & Filters**: Real-time keyword search, status tabs (All, Pending, Completed), priority filtering, and multiple sort orders.
- 📜 **Activity Timeline**: Automatic logging of all user activities (Task creation, completion, status updates, deletions) with clear timestamps.
- 📱 **Responsive Design**: Modern dashboard layout crafted with mobile and desktop responsiveness in mind.
