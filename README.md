# TaskMaster — Full-Stack Todo PWA

A production-ready, full-stack Todo application with JWT authentication, task management, transactional email reminders, device push notifications, forgot/reset password, and full PWA support (installable on Android & iOS). Deployed on Render with MongoDB Atlas.

🔗 **Live App:** https://todo-app-7ddz.onrender.com

---

## Features

| Category | Detail |
|---|---|
| **Authentication** | JWT signup / login / logout with bcrypt password hashing |
| **Forgot Password** | Secure token-based reset flow — email link expires in 1 hour |
| **Task Management** | Create, edit, complete, delete tasks with priority levels & due dates |
| **Search & Filters** | Real-time search, status/priority filters, multiple sort orders |
| **Email Reminders** | Automated (every minute) + on-demand reminders via **Brevo HTTP API** |
| **Push Notifications** | Native device push via Web Push API + VAPID — works on Android & desktop |
| **PWA — Installable** | Install button in-app; Add to Home Screen on iOS; offline fallback |
| **Activity Log** | Auto-logs all task events; per-item checkbox deletion or clear-all |
| **Custom UI Dialogs** | All confirmations use in-app modals — no browser `confirm()` popups |
| **Responsive Design** | Mobile bottom tab bar + FAB; sticky glassy nav; 2×2 metrics; full-bleed cards |
| **Safe-area Support** | Respects iPhone notch & home indicator in PWA standalone mode |

---

## Project Structure

```
todo-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── models/
│   │   │   ├── User.js                  ← resetPasswordToken fields added
│   │   │   ├── Todo.js
│   │   │   ├── Activity.js
│   │   │   └── PushSubscription.js
│   │   ├── controllers/
│   │   │   ├── authController.js        ← forgotPassword + resetPassword
│   │   │   ├── todoController.js
│   │   │   ├── activityController.js    ← deleteSelected endpoint
│   │   │   └── pushController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js            ← /forgot-password, /reset-password/:token
│   │   │   ├── todoRoutes.js
│   │   │   ├── activityRoutes.js        ← DELETE /selected
│   │   │   └── pushRoutes.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   ├── services/
│   │   │   ├── emailService.js          ← Brevo HTTP API (no SMTP)
│   │   │   ├── reminderScheduler.js     ← runs every 1 minute
│   │   │   └── pushService.js
│   │   └── server.js
│   └── package.json
│
└── frontend/
    ├── public/
    │   ├── manifest.json
    │   ├── sw.js                        ← network-first for HTML (cache v2)
    │   ├── icon-192.png
    │   ├── icon-512.png
    │   └── apple-touch-icon.png
    ├── src/
    │   ├── components/
    │   │   ├── Logo.jsx                 ← custom SVG logo component
    │   │   ├── TodoForm.jsx
    │   │   ├── TodoItem.jsx
    │   │   ├── TodoList.jsx
    │   │   └── ActivityList.jsx         ← per-item checkboxes + delete selected
    │   ├── pages/
    │   │   ├── Login.jsx                ← forgot password link
    │   │   ├── Register.jsx
    │   │   ├── ForgotPassword.jsx
    │   │   ├── ResetPassword.jsx
    │   │   └── Dashboard.jsx            ← mobile tab bar, FAB, install prompt
    │   ├── services/
    │   │   ├── authService.js           ← forgotPassword + resetPassword
    │   │   ├── todoService.js
    │   │   ├── activityService.js       ← deleteSelected
    │   │   └── pushService.js
    │   ├── App.jsx                      ← reset token URL detection
    │   ├── main.jsx
    │   └── index.css                    ← full responsive design system
    ├── index.html
    └── vite.config.js
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

The repo includes a `render.yaml` Blueprint. Render reads it automatically when you click **"New → Blueprint"** and creates the web service in one step.

### Required Environment Variables (set in Render dashboard)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string — paste as a single line |
| `JWT_SECRET` | Any long random string |
| `BREVO_API_KEY` | From Brevo → Settings → API Keys. Use the **API v3 key** (`xkeysib-…`), not the SMTP key |
| `BREVO_SENDER_EMAIL` | The sender address you verified in Brevo |
| `VAPID_PUBLIC_KEY` | Generated VAPID public key |
| `VAPID_PRIVATE_KEY` | Generated VAPID private key |
| `VAPID_EMAIL` | Contact email for VAPID |
| `APP_URL` | `https://your-app.onrender.com` — used in password reset email links |

> **MongoDB Atlas:** Add `0.0.0.0/0` to **Network Access → IP Access List** so Render's dynamic IPs can connect.

> **Why Brevo instead of Gmail SMTP?** Render's free tier blocks outbound SMTP port 587. Brevo's HTTP API bypasses this entirely and can deliver to any address once your sender email is verified.

---

## Install as a Mobile App (PWA)

**Android / Chrome / Edge**
- An **Install App** button appears automatically in the top nav when the browser detects the app meets PWA criteria
- Tap it → native install dialog appears → app icon is added to your home screen
- The button disappears once the app is already installed

**iPhone / Safari**
- Tap **Install App** → a banner appears: *"Tap the Share button in Safari, then choose Add to Home Screen"*
- iOS Safari does not support the native install prompt; this is the standard workaround

Once installed the app runs in full-screen standalone mode, respecting the iPhone notch and home indicator via CSS `env(safe-area-inset-*)`.

---

## Push Notification Flow

1. User taps **Notifs Off** in the nav header → browser requests permission → user allows
2. Browser creates a Web Push subscription and registers it at `POST /api/push/subscribe`
3. The scheduler runs **every minute** — finds tasks due within the next 24 hours
4. For each due task: sends an **email** + **push notification** in parallel to all subscribed devices for that user
5. Tapping **Send Reminder** on any task triggers an immediate email + push

---

## Forgot Password Flow

1. User clicks **Forgot your password?** on the login screen
2. Enters their email — backend generates a cryptographically random token, stores its SHA-256 hash in the database
3. A reset link is emailed: `https://your-app.onrender.com/?reset=TOKEN`
4. Clicking the link opens the **Set New Password** screen (token extracted from URL)
5. On success the token is cleared, the URL is cleaned up, and the user is redirected to login
6. Token expires after **1 hour** — response is always `success` regardless of whether the email exists, to prevent user enumeration

---

## Activity Log

- Every task action (Created, Updated, Completed, Reopened, Deleted) is recorded with a timestamp
- **Per-item checkboxes** — click a row or its checkbox to select it
- **Select All / Deselect All** toggle at the top of the list
- **Delete Selected** — removes only the checked entries after an in-app confirmation
- **Clear All** — removes the entire log after confirmation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Lucide Icons |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Password Reset | Node.js `crypto` (SHA-256 token hash) |
| Email | Brevo HTTP API (transactional, no SMTP) |
| Push | Web Push API + VAPID (`web-push` package) |
| PWA | Service Worker (network-first HTML), Web App Manifest |
| Scheduler | node-cron (every 1 minute) |
| Deployment | Render (free tier) + MongoDB Atlas (free tier) |
