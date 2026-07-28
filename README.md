# Distributed Session Authentication API

A clean, production-ready session authentication backend built using **Node.js**, **Express**, **MongoDB (Mongoose)**, and **Redis**.

This project implements robust stateful authentication, using `bcrypt` for secure hashing and `connect-redis` to offload active session state into Redis for horizontal scalability.

---

## Features

- **Secure User Registration & Login** (Password hashing using bcrypt with 12 salt rounds).
- **Stateful Session Store** (Sessions cached in Redis with customizable TTL).
- **Hardened HTTP Cookies** (Using `HttpOnly`, `Secure`, and `SameSite` options to defend against XSS and CSRF).
- **Guarded API Endpoints** (Flexible auth middleware checking for active sessions).
- **Verification Suite** (Built-in lifecycle testing script).

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Session Cache**: Redis
- **Security**: Bcrypt

---

## Directory Structure

```text
server/
├── config/
│   ├── db.js          # MongoDB connection handler
│   └── redis.js       # Redis client setup & retry limits
├── controllers/
│   └── authController.js # Auth operations (register, login, logout, me)
├── middleware/
│   └── authMiddleware.js # Protected route guard
├── models/
│   └── User.js        # User model & pre-save hash middleware
├── routes/
│   └── authRoutes.js  # Auth route mapping
├── app.js             # Express application entry point
└── test.js            # Automated verification test script
```

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB & Redis running locally, or access to cloud hosting instances (such as MongoDB Atlas & Upstash Redis).

### 2. Installation
Clone the repository, navigate to the folder, and install dependencies:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```ini
PORT=5000
MONGO_URI=mongodb://localhost:27017/session-auth
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your_secret_session_key
NODE_ENV=development
```

### 4. Running the Server
Start the server in development mode with hot-reloading:
```bash
npm run dev
```

---

## API Documentation

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Register a new account |
| `/api/auth/login` | `POST` | Public | Create session and return cookie |
| `/api/auth/logout` | `POST` | Private | Destroy session and clear cookie |
| `/api/auth/me` | `GET` | Private | Retrieve active profile details |
| `/status` | `GET` | Public | Health check / Redis connection status |

---

## Testing

With the server running, you can verify all authentication workflows (Register ➔ Login ➔ Access Guarded Route ➔ Logout ➔ Verify Revocation) automatically by running:
```bash
node server/test.js
```