# TaskMaster — Full-Stack Todo PWA

A modern, full-stack Todo application with JWT authentication, task management, email reminders, **push notifications**, and **PWA support** (installable on mobile/desktop). Deployed on Render with MongoDB Atlas.

🔗 **Live App:** https://todo-app-7ddz.onrender.com

---

## Features

- 🔐 **Authentication** — JWT-based signup/login with bcrypt encryption
- 📋 **Task Management** — Create, edit, complete, delete tasks with priorities & due dates
- 🔍 **Search & Filters** — Real-time search, status/priority filters, multiple sort orders
- 📧 **Email Reminders** — Automated + on-demand email reminders via Gmail SMTP (nodemailer)
- 🔔 **Push Notifications** — Native device push notifications via Web Push API (works on mobile & desktop)
- 📱 **PWA — Installable** — Add to home screen on Android/iOS; works offline; app icon & splash screen
- 📜 **Activity Timeline** — Auto-logs all task events with timestamps
- ☁️ **Cloud Deployed** — Backend on Render, database on MongoDB Atlas

---

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
│   │   │   ├── Activity.js
│   │   │   └── PushSubscription.js      ← NEW
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── todoController.js
│   │   │   ├── activityController.js
│   │   │   └── pushController.js        ← NEW
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── todoRoutes.js
│   │   │   ├── activityRoutes.js
│   │   │   └── pushRoutes.js            ← NEW
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   ├── services/
│   │   │   ├── emailService.js
│   │   │   ├── reminderScheduler.js     ← updated (email + push)
│   │   │   └── pushService.js           ← NEW
│   │   └── server.js
│   └── package.json
│
└── frontend/
    ├── public/
    │   ├── manifest.json                ← NEW (PWA manifest)
    │   ├── sw.js                        ← NEW (service worker)
    │   ├── icon-192.png                 ← NEW
    │   ├── icon-512.png                 ← NEW
    │   └── apple-touch-icon.png         ← NEW
    ├── src/
    │   ├── components/
    │   │   ├── TodoForm.jsx
    │   │   ├── TodoItem.jsx
    │   │   ├── TodoList.jsx
    │   │   └── ActivityList.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── Dashboard.jsx            ← updated (push toggle button)
    │   ├── services/
    │   │   ├── authService.js
    │   │   ├── todoService.js
    │   │   ├── activityService.js
    │   │   └── pushService.js           ← NEW
    │   ├── App.jsx
    │   ├── main.jsx                     ← updated (registers SW)
    │   └── index.css
    ├── index.html                       ← updated (manifest + PWA meta tags)
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
JWT_SECRET=your_jwt_secret

# Email (Gmail)
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_FROM="TaskMaster Reminders" <your@gmail.com>

# Push Notifications (generate with: node -e "require('web-push').generateVAPIDKeys()")
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your@gmail.com
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

### Environment Variables (set in Render dashboard)

| Key | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Any long random secret string |
| `SMTP_USER` | Gmail address for sending reminders |
| `SMTP_PASS` | Gmail App Password |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_FROM` | `"TaskMaster Reminders" <your@gmail.com>` |
| `VAPID_PUBLIC_KEY` | Generated VAPID public key |
| `VAPID_PRIVATE_KEY` | Generated VAPID private key |
| `VAPID_EMAIL` | Your email for VAPID |
| `VITE_API_URL` | `https://your-app.onrender.com/api` |

Render auto-deploys on every push to `main` via `render.yaml`.

---

## Install as Mobile App (PWA)

**Android (Chrome):**
1. Open the live URL in Chrome
2. Tap the **three-dot menu** → **Add to Home Screen**
3. The app installs with its own icon

**iPhone (Safari):**
1. Open the live URL in Safari
2. Tap the **Share** button → **Add to Home Screen**

Once installed, tap the **"Notifs Off"** button in the app header to enable push notifications on your device.

---

## Push Notification Flow

1. User taps **"Notifs Off"** → browser asks permission → user allows
2. Browser subscribes to Web Push and sends subscription to backend (`/api/push/subscribe`)
3. Reminder scheduler runs every 15 minutes, finds tasks due within 24 hours
4. For each due task: sends **email** + **push notification** to all subscribed devices
5. On-demand: clicking **"Send Reminder"** on a task triggers an immediate email

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Lucide Icons |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Email | Nodemailer + Gmail SMTP |
| Push | Web Push API + VAPID |
| PWA | Service Worker, Web App Manifest |
| Deployment | Render (free tier) + MongoDB Atlas |
