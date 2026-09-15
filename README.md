# TaskMaster — Full-Stack Todo PWA

A production-ready, full-stack productivity app with JWT authentication, multiple views, real-time task management, email reminders, push notifications, Pomodoro timer, and full PWA support. Deployed on Render with MongoDB Atlas.

🔗 **Live App:** https://todo-app-7ddz.onrender.com

---

## Features

### Task Management
| Feature | Detail |
|---|---|
| **Create / Edit / Delete** | Full CRUD with priority levels (high / medium / low) and due dates |
| **Tags & Labels** | Color-coded tag chips — add with Enter or comma, remove with Backspace |
| **Subtasks** | Nested checklist per task with live progress bar |
| **Recurring Tasks** | Daily / weekly / monthly — auto-creates next instance on completion |
| **Drag & Drop Reorder** | Custom sort mode with touch + pointer sensor support |
| **Bulk Actions** | Select multiple tasks → complete or delete in one click |
| **Due Date Guard** | Past dates cannot be selected — minimum is always today |

### Views
| View | Detail |
|---|---|
| **List View** | Filterable, sortable task list with subtasks, tags, and recurrence badges |
| **Kanban Board** | Three columns — To Do / In Progress / Done — with move controls |
| **Calendar View** | Monthly grid grouped by due date; click a day to see its tasks |
| **Stats Panel** | Completion streak, 14-day bar chart, completion rate, overdue count |

### Productivity
| Feature | Detail |
|---|---|
| **Pomodoro Timer** | Floating widget — 25 min focus / 5 min break / 15 min long break; SVG ring countdown; session dot tracking; Web Audio beep |
| **Dark Mode** | Full dark theme toggle persisted in localStorage |
| **Keyboard Shortcuts** | `N` — new task, `D` — dark mode, `Escape` — close modals |
| **Confetti** | Fires when the last pending task is completed |

### Notifications & Reminders
| Feature | Detail |
|---|---|
| **Email Reminders** | Automated reminders via Brevo HTTP API — DUE TODAY / DUE SOON / OVERDUE labels |
| **Push Notifications** | Native device push via Web Push API + VAPID |
| **Weekly Summary Email** | Every Monday 8 AM — completed tasks last 7 days + tasks due this week |
| **On-demand Reminder** | Send Reminder button on any task fires email + push immediately |
| **Mute** | Snooze reminders per task for 1h / 3h / 24h |
| **External Cron Trigger** | `POST /api/internal/run-reminders` called by cron-job.org every minute — reminders fire even when Render is spun down |

### Overdue Logic
Tasks are marked overdue only **after midnight of the day following the due date** — a task due today is always shown as pending, never overdue. This applies consistently across list view, Kanban, calendar, stats panel, and reminder emails.

### Authentication & Profile
| Feature | Detail |
|---|---|
| **Register / Login** | JWT + bcrypt; login by email or username |
| **Username** | Unique @username with real-time availability check on registration |
| **Profile Modal** | Avatar (initials), name, @username, email, member since, task stats, account deletion |
| **Forgot / Reset Password** | Cryptographic token, SHA-256 hashed, expires in 1 hour |

### PWA
| Feature | Detail |
|---|---|
| **Installable** | Install button in nav for Android/Chrome/Edge; banner guide for iOS Safari |
| **Offline Fallback** | Service worker with network-first HTML strategy |
| **Safe-area** | Respects iPhone notch and home indicator via `env(safe-area-inset-*)` |

### General
- Activity log with per-item deletion and clear-all
- In-app modals for all confirmations — no browser `confirm()` popups
- Mobile bottom tab bar + FAB
- Responsive design across all screen sizes

---

## Project Structure

```
todo-app/
├── backend/
│   └── src/
│       ├── config/
│       │   └── database.js
│       ├── models/
│       │   ├── User.js               ← username, resetPasswordToken
│       │   ├── Todo.js               ← tags, subtasks, status, recurrence, order
│       │   ├── Activity.js
│       │   └── PushSubscription.js
│       ├── controllers/
│       │   ├── authController.js     ← register, login, username, deleteAccount, forgot/reset password
│       │   ├── todoController.js     ← CRUD, bulk, reorder, subtask toggle, recurring, shift date
│       │   ├── activityController.js
│       │   └── pushController.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── todoRoutes.js         ← /bulk, /reorder before /:id
│       │   ├── activityRoutes.js
│       │   └── pushRoutes.js
│       ├── middleware/
│       │   └── authMiddleware.js
│       ├── services/
│       │   ├── emailService.js       ← Brevo HTTP API — reminder + weekly summary emails
│       │   ├── reminderScheduler.js  ← node-cron every 1 min + weekly cron Monday 8AM
│       │   └── pushService.js
│       └── server.js                 ← POST /api/internal/run-reminders (external cron trigger)
│
└── frontend/
    ├── public/
    │   ├── manifest.json
    │   ├── sw.js
    │   ├── icon-192.png
    │   ├── icon-512.png
    │   └── apple-touch-icon.png
    └── src/
        ├── components/
        │   ├── TodoForm.jsx           ← tags, subtasks, recurrence, due date min guard
        │   ├── TodoItem.jsx           ← drag handle, subtask progress, recurrence badge, bulk checkbox
        │   ├── TodoList.jsx           ← DnD context, SortableTodoItem, bulk mode, tag filter
        │   ├── KanbanBoard.jsx        ← 3-column kanban with move controls
        │   ├── CalendarView.jsx       ← monthly grid with task dots
        │   ├── StatsPanel.jsx         ← streak, bar chart, quick stats
        │   ├── PomodoroTimer.jsx      ← floating widget, SVG ring, audio beep
        │   ├── ProfileModal.jsx       ← avatar, stats, danger zone
        │   ├── UsernameSetupModal.jsx ← one-time modal for existing users without username
        │   └── ActivityList.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx           ← username field with live availability check
        │   ├── ForgotPassword.jsx
        │   ├── ResetPassword.jsx
        │   └── Dashboard.jsx          ← view toggle, dark mode, keyboard shortcuts, confetti
        ├── services/
        │   ├── authService.js
        │   ├── todoService.js         ← reorderTodos, moveKanban, toggleSubtask, bulkAction
        │   ├── activityService.js
        │   └── pushService.js
        ├── App.jsx
        ├── main.jsx
        └── index.css
```

---

## Local Development

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/todo-app
JWT_SECRET=your_jwt_secret_here

# Brevo transactional email — https://brevo.com
# Use an API Keys type key (xkeysib-...), NOT the SMTP key
BREVO_API_KEY=xkeysib-your-key-here
BREVO_SENDER_EMAIL=you@yourdomain.com

# Web Push VAPID keys
# Generate once: node -e "require('web-push').generateVAPIDKeys()"
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=you@yourdomain.com

# Password reset links point to this base URL
APP_URL=http://localhost:3000

# External cron trigger secret (any long random string)
INTERNAL_CRON_SECRET=your_cron_secret_here
```

```bash
npm run dev   # starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev   # starts on http://localhost:3000
```

---

## Production Deployment (Render + MongoDB Atlas)

The repo includes a `render.yaml` Blueprint. Click **New → Blueprint** in Render and it creates the web service automatically.

### Required Environment Variables

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Any long random string |
| `BREVO_API_KEY` | Brevo API v3 key (`xkeysib-…`) — not the SMTP key |
| `BREVO_SENDER_EMAIL` | Verified sender address in Brevo |
| `VAPID_PUBLIC_KEY` | Generated VAPID public key |
| `VAPID_PRIVATE_KEY` | Generated VAPID private key |
| `VAPID_EMAIL` | Contact email for VAPID |
| `APP_URL` | `https://your-app.onrender.com` — used in password reset links |
| `INTERNAL_CRON_SECRET` | Secret header value for the external cron trigger endpoint |

> **MongoDB Atlas:** Add `0.0.0.0/0` to **Network Access → IP Access List** so Render's dynamic IPs can connect.

> **Why Brevo instead of Gmail SMTP?** Render's free tier blocks outbound SMTP port 587. Brevo's HTTP API bypasses this and can deliver to any address once your sender email is verified.

### Keeping Reminders Active on Render Free Tier

Render free tier spins down after ~15 minutes of inactivity, stopping all cron jobs. To keep reminders firing 24/7:

1. Set `INTERNAL_CRON_SECRET` in your Render environment
2. Create a free account at [cron-job.org](https://cron-job.org)
3. Add a new job:
   - **URL:** `https://your-app.onrender.com/api/internal/run-reminders`
   - **Method:** `POST`
   - **Schedule:** Every 1 minute
   - **Header:** `x-cron-secret: your_cron_secret_here`

This wakes the server on every tick and triggers the reminder check directly, so no reminder window is ever missed.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `N` | Focus the new task title input |
| `D` | Toggle dark / light mode |
| `Escape` | Close any open modal |

---

## Pomodoro Timer

- Click the **Timer** button in the nav to open the floating widget
- **Focus:** 25 minutes — select a task to work on from the dropdown
- **Short Break:** 5 minutes (after each focus session)
- **Long Break:** 15 minutes (after every 4 focus sessions)
- Session dots track progress toward the long break
- A Web Audio beep plays when the timer ends
- Minimize to a compact `MM:SS` display — the widget stays fixed bottom-right

---

## Recurring Tasks

Set recurrence to **Daily**, **Weekly**, or **Monthly** when creating a task. When you mark it complete, a new instance is automatically created with the next due date. The completed original is kept as a history record.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Lucide Icons |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Confetti | canvas-confetti |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Password Reset | Node.js `crypto` (SHA-256 token hash) |
| Email | Brevo HTTP API (transactional, no SMTP) |
| Push | Web Push API + VAPID (`web-push` package) |
| PWA | Service Worker (network-first), Web App Manifest |
| Scheduler | node-cron + external trigger via cron-job.org |
| Deployment | Render (free tier) + MongoDB Atlas (free tier) |
