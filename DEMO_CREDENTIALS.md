# Cut the Queue — Demo & Admin Credentials

This document contains pre-configured credentials for development and demonstration purposes.

> **Note**: Passwords in SQLite are securely hashed using bcrypt (`bcryptjs`, 10 rounds). Plaintext passwords are never stored in the database.

---

## 🏛️ Restaurant Admin (Kitchen & Operations)

These accounts provide access to the **Restaurant Admin Console** (`https://cuthequeue-admin.vercel.app` or local port `5174`):

### 1. The Rameshwaram Cafe (Indiranagar)
- **Role**: Restaurant Admin
- **Manager**: Rohan Sharma
- **Email**: `campus@demo.com`
- **Password**: `password123` *(also accepts `admin123`)*
- **Associated Branch**: *The Rameshwaram Cafe - Indiranagar* (ID: 1)
- **Features**: Live kitchen order tickets, order stage transitions (Pending -> Preparing -> Ready), QR scanner pickup validation, audio/visual chimes.

### 2. Empire Restaurant (Church Street)
- **Role**: Restaurant Admin
- **Manager**: Farhan Khan
- **Email**: `spice@demo.com`
- **Password**: `password123` *(also accepts `admin123`)*
- **Associated Branch**: *Empire Restaurant - Church Street* (ID: 5)
- **Features**: Mughlai feast queues, late-night order fulfillment, menu item toggles.

### 3. Meghana Foods (Koramangala)
- **Role**: Restaurant Admin
- **Manager**: Arjun Rao
- **Email**: `meghana@demo.com`
- **Password**: `password123` *(also accepts `admin123`)*
- **Associated Branch**: *Meghana Foods - Koramangala* (ID: 10)
- **Features**: Andhra biryani queue management, live kitchen throughput metrics.

---

## 👑 Super Administrator (Platform Oversight)
- **Role**: Super Admin
- **Name**: System Administrator
- **Email**: `admin@cutthequeue.com`
- **Password**: `password123` *(also accepts `admin123`)*
- **Features**: Platform-wide GMV, restaurant onboarding, franchise performance overview.

---

## 🍽️ Customer Accounts (Ordering & Live Tracking)
- **Role**: Customer
- **Name**: Alex Morgan
- **Email**: `customer@demo.com`
- **Password**: `password123`
- **Features**: Menu browsing, cart customization, real-time queue & status tracking, digital token QR code.

- **Role**: Customer
- **Name**: Yashvanth Nayak
- **Email**: `yashvanthnayak1104@gmail.com`
- **Password**: `password123`

---

## 🔗 Quick API Endpoints

- **Live Health**: `GET /api/health`
- **Demo Users Directory**: `GET /api/auth/demo-users`
- **Login API**: `POST /api/auth/login`
  ```json
  {
    "email": "campus@demo.com",
    "password": "password123"
  }
  ```
- **Login Response**:
  ```json
  {
    "message": "Login successful",
    "token": "<jwt-token>",
    "user": {
      "id": 2,
      "name": "Rohan Sharma (The Rameshwaram Cafe)",
      "email": "campus@demo.com",
      "role": "restaurant_admin"
    },
    "restaurant": {
      "id": 1,
      "name": "The Rameshwaram Cafe - Indiranagar"
    }
  }
  ```
