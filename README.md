# WebDev-L3-PizzaDelight (PizzaDelight) — Full-Stack MERN Food Delivery Application

PizzaDelight is a production-ready, full-stack food delivery application built on the MERN stack (MongoDB, Express, React, Node.js) with TypeScript, Tailwind CSS, and Vite. It features interactive custom pizza creation, real-time pricing, stock-aware inventory tracking, automated low-stock alerting, 6-digit email OTP verification, JWT-based session security, role-based admin controls, and hardened Razorpay payment processing.

---

## 🍕 Architecture & Repository Structure

The project is structured into modular backend and frontend services:

```
WebDev-L3-PizzaDelight/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment, MongoDB connection, catalog & product options
│   │   ├── controllers/     # Auth, Order, Payment, Product, Admin, Health, Internal
│   │   ├── jobs/            # Scheduled task routines (low-stock notification engine)
│   │   ├── middleware/      # Auth guard, Cron bearer auth, security headers, rate-limiting, errors
│   │   ├── models/          # User, Admin, Pizza, Inventory, Order, Payment
│   │   ├── routes/          # Express route declarations (auth, order, payment, product, admin, internal)
│   │   ├── services/        # Business logic (OTP, Razorpay HMAC verification, Email, Inventory)
│   │   └── utils/           # JWT signing/verification, crypto tokens
│   ├── scripts/             # DB seeders (pizzas, inventory), admin generator, smoke test, diagnostic scripts
│   ├── test/                # Unit test suite (133 passing tests covering auth, orders, payments, OTP)
│   ├── Dockerfile           # Multi-stage production container definition (Node.js 22 Alpine)
│   ├── .env.example         # Template for all backend environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── services/        # Modular API client modules (adminApi, authApi, orderApi, paymentApi, productApi)
│   │   ├── App.tsx          # Root router and global navigation layout
│   │   ├── CustomerLayout.tsx # Shared authenticated customer shell & header navigation
│   │   ├── CustomerDashboard.tsx # Pizza catalog & custom interactive pizza builder
│   │   ├── PizzaDetails.tsx # Detailed pizza viewing and cart addition view
│   │   ├── Payment.tsx      # Secure checkout & Razorpay payment handler
│   │   ├── OrderDetails.tsx # Live order tracking & itemized status receipt
│   │   ├── VerifyOtp.tsx    # 6-digit email OTP verification UI with resend cooldown
│   │   ├── EmailVerification.tsx # Email verification landing page
│   │   ├── ForgotPassword.tsx   # Password reset request portal
│   │   ├── ResetPassword.tsx    # Secure token-based password reset form
│   │   ├── Profile.tsx      # Customer account settings & order history
│   │   ├── AdminLogin.tsx   # Dedicated administrator authentication screen
│   │   ├── AdminInventory.tsx # Real-time ingredient stock control & restock panel
│   │   ├── AdminOrdersList.tsx # Kitchen Kanban & lifecycle management dashboard
│   │   ├── AdminOrderDetails.tsx # Deep inspection of customer order details
│   │   └── AboutPage.tsx    # Brand story, freshness promise, and mission view
│   ├── public/              # Static media assets, crust illustrations, topping icons
│   ├── vercel.json          # Single-Page Application (SPA) client-side rewrite rules
│   ├── .env.example         # Template for frontend environment variables
│   └── package.json
│
├── .gitignore               # Multi-tier secret, build output, log, and artifact ignore rules
└── README.md                # Comprehensive project documentation and operations guide
```

---

## 🚀 Key Features

- **Interactive Pizza Builder**: Real-time selection of crust bases, gourmet sauces, artisan cheeses, and fresh vegetable toppings with instant price calculation and stock-level enforcement.
- **Hardened Payment Flow**:
  - Razorpay Standard Checkout with seamless method preselection (`upi`, `card`, `netbanking`, `wallet`).
  - Strict client authentication guard and return-to redirect preserving cart state.
  - Server-authoritative order creation and HMAC SHA-256 cryptographic signature verification.
  - Atomic ingredient stock deduction upon verified payment completion.
- **Multi-Factor & Account Security**:
  - 6-digit email OTP verification for new user registrations with rate limiting and anti-enumeration.
  - Secure password reset via time-limited cryptographic reset tokens.
  - Bcrypt password hashing (12 salt rounds) and JWT authentication with protected role guards.
- **Inventory Management & Cron Monitoring**:
  - Real-time stock decrement upon order confirmation.
  - Protected HTTP scheduler endpoint (`POST /api/internal/cron/low-stock`) authenticated via `CRON_SECRET` for automated alerts.
  - Standalone low-stock CLI check (`npm run check-low-stock`) for manual or local cron usage.
- **Admin Dashboard**:
  - Dedicated administrator authentication portal.
  - Live stock tracking, low-stock threshold alerting, and manual quantity replenishment.
  - Kitchen lifecycle order tracking (`ORDERED` -> `IN_KITCHEN` -> `BAKING` -> `OUT_FOR_DELIVERY` -> `DELIVERED`).

---

## 🛠️ Prerequisites

- **Node.js**: `v18.0.0` or higher (`v20+` recommended)
- **npm**: `v9.0.0` or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/pizza_delivery`) or MongoDB Atlas connection URI
- **Razorpay Account (Test Mode)**: Key ID and Key Secret (test keys are provided for development)
- **SMTP Service (Optional)**: Gmail App Password or SMTP provider (if unconfigured, emails are automatically logged to the development console)

---

## ⚙️ Backend Setup & Configuration

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `backend/.env` variables:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/pizza_delivery

   # CRITICAL: In production, JWT_SECRET must be at least 32 characters long
   JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
   JWT_EXPIRES_IN=1d
   CLIENT_URL=http://localhost:5173

   # Email & SMTP (Leave empty to log OTP & reset emails in terminal during development)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   EMAIL_FROM=no-reply@pizzadelight.com
   ADMIN_EMAIL=admin@pizzadelight.com

   # Razorpay Test Mode
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   RAZORPAY_CURRENCY=INR

   # Scheduler Secret (for external cron triggers)
   CRON_SECRET=your_secure_cron_secret
   ```

4. Install backend dependencies:
   ```bash
   npm install
   ```

5. Seed database catalog and inventory items:
   ```bash
   npm run seed-pizzas
   npm run seed-inventory
   ```

6. Create an administrator account:
   ```bash
   npm run create-admin -- "Store Admin" admin@pizzadelight.com AdminPassword123!
   ```

7. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will listen at `http://localhost:5000` with health check at `http://localhost:5000/api/health`.

---

## 💻 Frontend Setup & Configuration

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `frontend/.env` variables:
   ```env
   # Backend API Base URL
   VITE_API_URL=http://localhost:5000/api

   # Razorpay Key ID (Optional fallback; provided dynamically by backend order endpoint)
   VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
   ```

4. Install frontend dependencies:
   ```bash
   npm install
   ```

5. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The application UI will be available at `http://localhost:5173`.

---

## 🧪 Testing & Verification

### Backend Verification Suite
Execute from the `backend/` directory:
- **Unit & Integration Test Suite** (133 tests):
  ```bash
  npm test
  ```
- **Health Smoke Test**:
  ```bash
  npm run smoke
  ```
- **Low-Stock Inventory Check**:
  ```bash
  npm run check-low-stock
  ```

### Frontend Verification Suite
Execute from the `frontend/` directory:
- **TypeScript Type Checking**:
  ```bash
  npm run typecheck
  ```
- **Linter & Code Style**:
  ```bash
  npm run lint
  ```
- **Production Bundle Build**:
  ```bash
  npm run build
  ```
- **Preview Production Build**:
  ```bash
  npm run preview
  ```

---

## ⏰ Background Scheduling & Inventory Monitoring

The low-stock alert system monitors inventory levels and notifies the store administrator (`ADMIN_EMAIL`) whenever ingredient stock falls below its configured threshold.

Two execution modes are supported:
1. **Local / Manual Execution**:
   ```bash
   cd backend
   npm run check-low-stock
   ```
2. **Scheduled HTTP Endpoint (for Cloud / Serverless Cron)**:
   Trigger the protected endpoint using any external cron scheduler (e.g., cron-job.org, GitHub Actions, Vercel Cron):
   ```bash
   curl -X POST http://localhost:5000/api/internal/cron/low-stock \
     -H "Authorization: Bearer <CRON_SECRET>"
   ```

---

## 🌐 Deployment Architecture & Live URLs

| Component | Target Platform | Routing / Build Configuration | Deployed URL |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vercel | SPA rewrites via `vercel.json`, built with `vite build` | *Add your deployed frontend URL here* |
| **Backend** | Render / Railway / Cloud VPS | Node.js 22 Alpine via `backend/Dockerfile` | *Add your deployed backend API URL here* |
| **Database** | MongoDB Atlas | M0/M10 Free/Dedicated Cluster with IP access list | *mongodb+srv://...* |

### Production Environment Checklist
- [ ] Set `NODE_ENV=production` on the backend.
- [ ] Generate a secure 32+ character `JWT_SECRET` (`openssl rand -base64 32`).
- [ ] Update `CLIENT_URL` to match your deployed frontend domain.
- [ ] Update `VITE_API_URL` to match your deployed backend domain (`https://<your-backend-domain>/api`).
- [ ] Add `CRON_SECRET` to your hosting environment for scheduled alerts.
- [ ] Whitelist your backend server IP in MongoDB Atlas Network Access.

---

## 🔒 Security Best Practices

- **Zero-Secret Commits**: All actual `.env` files, `.local` overrides, private keys (`*.pem`, `*.key`), and certificates are strictly excluded via multi-tier `.gitignore` files.
- **Server-Authoritative Pricing**: Total amounts are strictly validated against database prices on the backend before creating Razorpay orders.
- **Cryptographic Verification**: Razorpay payment signatures are validated using timing-safe HMAC SHA-256 comparison (`crypto.timingSafeEqual`).
- **Production Guardrails**: In production mode, the application rejects weak JWT secrets (`< 32` characters) and enforces strict HTTP rate limits (Helmet headers + `express-rate-limit`).
- **Anti-Account Enumeration**: Password reset and OTP resend endpoints return identical generic status responses regardless of whether the email exists.

---

## ❓ Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `JWT_SECRET must be at least 32 characters in production` | Weak secret provided in production mode | Run `openssl rand -base64 32` and set the resulting string as `JWT_SECRET`. |
| `Database connection failed` / `MongooseServerSelectionError` | MongoDB is not running or URI is invalid | Ensure MongoDB service is running locally (`mongod`) or verify Atlas connection string and network whitelist. |
| `EADDRINUSE: address already in use :::5000` | Another process is occupying port 5000 | Stop the existing process or set `PORT=5001` in `.env` and update `VITE_API_URL` accordingly. |
| Email verification code not received | SMTP credentials unconfigured | In development mode, check your backend terminal logs. Outgoing codes are printed to the console when SMTP credentials are blank. |
| Razorpay checkout script fails to load | Network blocker or missing internet access | The checkout SDK is loaded dynamically from `https://checkout.razorpay.com/v1/checkout.js`. Verify network connectivity. |

---

## 📄 License

This project is licensed under the MIT License.
