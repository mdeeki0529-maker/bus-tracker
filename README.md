# 🚌 BusTrack — Real-Time Bus Tracking System

A full-stack real-time bus tracking web application with separate interfaces for **drivers**, **passengers**, and a **landing page**.

---

## 📁 Project Structure

```
bustrack/
├── backend/
│   ├── server.js          # Node.js + Express + Socket.IO backend
│   └── package.json
└── frontend/
    ├── index.html          # Landing page
    ├── shared/
    │   └── config.js       # Shared API config & helpers
    ├── user/
    │   ├── login.html      # Passenger login + register
    │   ├── dashboard.html  # Interactive map dashboard
    │   └── track.html      # Quick track (no login)
    └── driver/
        ├── login.html      # Driver login + register
        └── dashboard.html  # Driver location sharing panel
```

---

## 🚀 Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Start the Backend Server

```bash
npm start
```

The server will run on **http://localhost:3001**

### 3. Open the Frontend

Just open `frontend/index.html` in your browser (no build needed).

> **Note:** You can also serve the frontend with any static server:
> ```bash
> cd frontend
> npx serve .
> ```

---

## 🔑 Demo Credentials

### Driver Login
| Phone | Password | Name | Bus |
|-------|----------|------|-----|
| 9876543210 | driver123 | Ravi Kumar | BUS-101 |
| 9876543211 | driver123 | Suresh Patel | BUS-202 |

### Passenger Login
| Email | Password |
|-------|----------|
| priya@example.com | user123 |

---

## ✨ Features

### 🗺️ Passenger Interface
- **Login / Register** with email & password
- **Live map** showing all active buses (Leaflet + OpenStreetMap)
- **Real-time location updates** via WebSocket (Socket.IO)
- **Track by driver phone** — no login needed
- **Quick Track page** — enter any driver's phone to track instantly
- **Bus detail panel** with route stops, driver info, live status

### 🚌 Driver Interface
- **Login by phone number** (not email)
- **Register** with name, phone, bus number, route
- **Big START/STOP button** for easy one-tap tracking
- **Live GPS sharing** using browser's Geolocation API
- **Auto-simulated location** for demo/testing when GPS unavailable
- **Update log** showing each GPS broadcast
- **Route trail** drawn on map as driver moves
- **Speed, accuracy, coordinates** displayed live

### ⚙️ Backend
- Express.js REST API
- Socket.IO real-time WebSocket
- JWT authentication
- BCrypt password hashing
- In-memory data store (easily replaceable with MongoDB/PostgreSQL)
- Endpoints:
  - `POST /api/user/login` — Passenger login
  - `POST /api/user/register` — Passenger register
  - `POST /api/driver/login` — Driver login (by phone)
  - `POST /api/driver/register` — Driver register
  - `GET /api/buses` — All buses with live status
  - `GET /api/bus/:busId` — Single bus details
  - `GET /api/track/:phone` — Track bus by driver's phone
  - `GET /api/active-buses` — Currently active/online buses

### 🔌 Socket.IO Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `driver:start` | Client→Server | Driver begins sharing |
| `driver:location` | Client→Server | GPS coordinates update |
| `driver:stop` | Client→Server | Driver stops sharing |
| `bus:location` | Server→Client | Broadcast location to passengers |
| `bus:status` | Server→Client | Bus online/offline status change |

---

## 🛠️ Customization

### Change Server URL
Edit `frontend/shared/config.js`:
```js
const BUSTRACK_CONFIG = {
  API_BASE: 'http://YOUR_SERVER:3001/api',
  SOCKET_URL: 'http://YOUR_SERVER:3001',
  ...
};
```

### Add a Real Database
Replace the `Map()` data stores in `backend/server.js` with MongoDB or PostgreSQL queries.

### Deploy
- **Backend**: Deploy to Railway, Render, Heroku, or any Node.js host
- **Frontend**: Deploy to Netlify, Vercel, or any static host

---

## 📱 Mobile Support

The Driver Dashboard is optimized for **mobile browsers** — drivers can use their phone's GPS directly to share their location. Just open the driver dashboard URL on any smartphone.

---

## 🔒 Security Notes

- JWT tokens expire in 7 days
- Passwords hashed with bcryptjs (10 rounds)
- All Socket.IO events are JWT-verified before processing
- In production, use `https://` and set `JWT_SECRET` via environment variable:
  ```bash
  JWT_SECRET=your_secure_secret node server.js
  ```

---

Made with ❤️ for bus commuters everywhere
