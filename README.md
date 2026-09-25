# PizzaDelight — Full-Stack MERN Food Delivery Application

PizzaDelight is a production-ready, full-stack food delivery application built on the MERN stack (MongoDB, Express, React, Node.js) with TypeScript, Tailwind CSS, and Vite. It features interactive custom pizza creation, real-time pricing, stock-aware inventory tracking, automated low-stock alerting, 6-digit email OTP verification, JWT-based session security, role-based admin controls, and hardened Razorpay payment processing.

---

## 🍕 Architecture & Repository Structure

The project is structured into modular backend and frontend services:

```
PizzaDelight/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment, MongoDB, product catalog options
│   │   ├── controllers/     # Auth, Order, Payment, Product, Admin, Health
│   │   ├── jobs/            # Scheduled cron jobs (low-stock alerts)
│   │   ├── middleware/      # Auth guard, security headers, error handlers
│   │   ├── models/          # User, Admin, Pizza, Inventory, Order, Payment
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic (OTP, Razorpay, Email, Orders)
│   │   └── utils/           # JWT signing/verification, crypto tokens
│   ├── scripts/             # DB seeding, smoke testing, admin creation
│   ├── test/                # Unit and integration test suites
│   ├── .env.example         # Environment template for backend
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components & views
│   │   ├── services/        # API client modules (Auth, Order, Payment, Admin)
│   │   ├── App.tsx          # Root routing and application layout
│   │   ├── Payment.tsx      # Secure checkout & payment view
│   │   └── VerifyOtp.tsx    # 6-digit email OTP verification UI
│   ├── public/              # Static public assets
│   ├── .env.example         # Environment template for frontend
│   └── package.json
│
├── .gitignore               # Multi-tier secret and artifact ignore rules
└── README.md
```

---

## 🚀 Key Features

- **Interactive Pizza Builder**: Real-time selection of bases, sauces, cheeses, and vegetable toppings with live price calculations and dynamic inventory stock validation.
- **Hardened Payment Flow**:
  - Razorpay Standard Checkout with seamless method preselection (`upi`, `card`, `netbanking`, `wallet`).
  - Strict client authentication guard and return-to redirect preserving cart and selected method.
  - Server-authoritative order creation and HMAC SHA-256 cryptographic signature verification.
  - Atomic ingredient deduction upon verified payment completion.
- **Multi-Factor & Account Security**:
  - 6-digit email OTP verification for new user signups.
  - Secure password reset via time-limited cryptographic reset tokens.
  - Bcrypt password hashing (12 rounds) and JWT authentication with protected routes.
- **Inventory Management & Cron Monitoring**:
  - Real-time stock decrement upon order confirmation.
  - Scheduled background cron job monitoring inventory levels against configurable threshold limits.
- **Admin Dashboard**:
  - Dedicated admin authentication portal.
  - Live stock tracking, manual quantity replenishment, and order lifecycle management.

---

## 🛠️ Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas cluster URI
- **Razorpay Account**: Test mode Key ID and Key Secret (optional for offline testing)
- **SMTP Service**: Gmail App Password or SMTP credentials for outgoing verification emails

---

## ⚙️ Backend Setup & Configuration

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/pizza_delivery
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=1d
   CLIENT_URL=http://localhost:5173

   # SMTP Configuration (optional for simulated log emails)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   SMTP_FROM=no-reply@pizzadelight.com
   ADMIN_EMAIL=admin@pizzadelight.com

   # Razorpay Configuration
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   RAZORPAY_CURRENCY=INR
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Seed database catalog and inventory:
   ```bash
   npm run seed-pizzas
   npm run seed-inventory
   ```

6. (Optional) Create an administrator account:
   ```bash
   npm run create-admin -- "Store Admin" admin@pizzadelight.com AdminPassword123!
   ```

7. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will be available at `http://localhost:5000`.

---

## 💻 Frontend Setup & Configuration

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` variables:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
   ```

4. Install dependencies:
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

### Backend Tests
From the `backend/` directory:
- **Unit & Integration Suite**: `npm test`
- **Health Smoke Test**: `npm run smoke`
- **Low-Stock Check**: `npm run check-low-stock`

### Frontend Quality Checks
From the `frontend/` directory:
- **Type Checking**: `npm run typecheck`
- **Linter**: `npm run lint`
- **Production Build**: `npm run build`

---

## 🔒 Security Best Practices

- **Never Commit Secrets**: All credentials (`.env`, private keys, passwords) are strictly excluded via `.gitignore`.
- **Server-Authoritative Pricing**: Cart prices and totals are verified server-side before initiating payment orders.
- **Cryptographic Signatures**: Razorpay payments are verified using HMAC SHA-256 with timing-safe string comparison.
- **Input Sanitization**: Express middleware applies Helmet HTTP headers, CORS validation, and rate limiting.

---

## 📄 License

This project is licensed under the MIT License.
