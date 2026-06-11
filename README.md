# 🔥 Mad Burning

**MadBurning.com** — A full-stack ordering & payment platform for a Kigali-based restaurant, built with Node.js/Express, Firebase Firestore, and deployed on Vercel.

---

## 📋 Features

- **Online Menu** — Browse food categories (Chicken, Beef, Combos, Extras, Promotions)
- **Cart & Checkout** — Add items, choose Grab & Go or Delivery, GPS location capture
- **Mobile Money Payments** — Flutterwave integration for MTN MoMo & Airtel Money (Rwanda)
- **Admin Dashboard** — Manage orders, products, and referral codes
- **Referral System** — Admin creates influencer codes, tracks orders & commissions per code
- **Order Management** — View, update status, and clear orders from admin panel

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express 5 |
| Database | Firebase Firestore |
| Payments | Flutterwave (Mobile Money Rwanda) |
| Frontend | Vanilla HTML/CSS/JS |
| Deployment | Vercel |
| Auth | Session-based admin password |

---

## 📂 Project Structure

```
mad-burning/
├── server.js              # Express backend (API + payment routes)
├── vercel.json            # Vercel deployment config
├── package.json           # Dependencies
├── config/
│   └── firebase.js        # Firebase Admin SDK setup
├── admin/
│   ├── login.html         # Admin login page
│   └── index.html         # Admin dashboard (Orders, Products, Referrals)
├── assets/                # CSS, JS, images
├── index.html             # Homepage
├── menu.html              # Menu page
├── order.html             # Checkout with cart & payment
├── about.html             # About page
├── contact.html           # Contact page
└── .env                   # Environment variables (not committed)
```

---

## 🚀 Deployment — Collaborator Guide

This project deploys to **Vercel**. As a collaborator/owner, you can deploy using either method below.

### Prerequisites

- Node.js installed
- A [Vercel account](https://vercel.com)
- Project linked to your Vercel project

### Method 1: Vercel CLI (Recommended for Collaborators)

```bash
# 1. Install Vercel CLI globally
npm i -g vercel

# 2. Login to Vercel (opens browser)
vercel login

# 3. Deploy to production
vercel --prod
```

If login via browser fails, use a **Vercel Token**:

```bash
# Get your token from: https://vercel.com/account/tokens
vercel --token YOUR_TOKEN_HERE --prod
```

### Method 2: Deploy with One Command (Token Required)

```bash
npx vercel --token YOUR_VERCEL_TOKEN --prod
```

### Inspect Failed Deployments

If a deployment fails, inspect the logs:

```bash
npx vercel inspect <DEPLOYMENT_ID> --logs --token YOUR_TOKEN_HERE
```

Example:
```bash
npx vercel inspect dpl_6pzNJCENT7gAQxhPsT3JVM3eLLbg --logs --token YOUR_TOKEN_HERE
```

### Environment Variables Required on Vercel

Set these in your Vercel project settings → **Environment Variables**:

| Variable | Description |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK JSON (stringified) |
| `FLW_SECRET_KEY` | Flutterwave secret key for payments |
| `ADMIN_PASSWORD` | Admin dashboard password (default: `mad123`) |

---

## 🔌 API Endpoints

### Public
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/menu` | Fetch all menu products |
| `POST` | `/api/pay` | Initiate Mobile Money payment |
| `GET` | `/api/verify/:tx_ref` | Verify payment status |
| `POST` | `/api/orders` | Create a new order |
| `GET` | `/api/referrals/verify/:code` | Verify a referral code |

### Admin (Requires `x-admin-password` header)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/orders` | Fetch all orders |
| `PATCH` | `/api/admin/orders/:id` | Update order status |
| `GET` | `/api/admin/products` | Fetch all products |
| `POST` | `/api/admin/products` | Add a new product |
| `PATCH` | `/api/admin/products/:id` | Update a product |
| `DELETE` | `/api/admin/products/:id` | Delete a product |
| `GET` | `/api/admin/referrals` | Fetch all referral codes |
| `POST` | `/api/admin/referrals` | Create a referral code |
| `PATCH` | `/api/admin/referrals/:code` | Toggle code active/inactive |
| `DELETE` | `/api/admin/referrals/:code` | Delete a referral code |

---

## 🎯 Referral System (Admin Only)

### How It Works

1. **Admin creates a code** in the Admin Dashboard → Referrals tab
   - Set influencer name (e.g. "Jane Doe")
   - Set custom code (e.g. `JANE20`)
   - Set commission percentage (e.g. 10%)

2. **Customer enters code** at checkout on `order.html`
   - Code is verified in real-time against Firestore
   - Valid codes show the influencer name and commission %

3. **Orders are tracked** with the referral code stored in Firestore
   - Admin can see which orders came from which influencer
   - Stats show total orders, revenue, and commissions per code

### Admin Panel Access

- URL: `/admin/login.html`
- Default password: `mad123` (change via `ADMIN_PASSWORD` env variable)

---

## 🏃 Local Development

```bash
# Install dependencies
npm install

# Copy .env template and fill in your credentials
cp .env.example .env

# Start server
npm start
# or
node server.js
```

Server runs on `http://localhost:3000`

---

## 👥 Collaborators

| Name | Role | GitHub |
|---|---|---|
| Henryhappy548 | Collaborator / Contributor | @Henryhappy548 |
| mugisha123-max | Owner | @mugisha123-max |

---

## 📄 License

Private project. All rights reserved.
