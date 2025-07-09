# 🏗️ Tender Management Platform – Developer Guide

A complete system for managing tenders with role-based access. End-users can rate companies, contractors can manage their listings, and admins oversee everything through a secure backend.

---
## Demo Screenshot

<img src="https://github.com/sunilsonumonu12/Demo/blob/b8a4a5cb29fd2d2d8f689102f7a3a9387492bb44/image2.png?raw=true" alt="image alt" width="400"/>

## 🚀 Live Links

- **Backend:** https://your-backend-url.com  
- **Frontend:** https://your-frontend-url.com  
- **GitHub:** [sunilsonumonu12/TenderPlatform](https://github.com/sunilsonumonu12/TenderPlatform)

---

## 📚 Table of Contents

- [Overview](#overview)  
- [Tech Stack](#tech-stack)  
- [🔐 Authentication Flow](#-authentication-flow)  
- [👤 User Features](#-user-features)  
- [🏢 Contractor Features](#-contractor-features)  
- [🛠️ Admin Features](#️-admin-features)  
- [🗄️ Database Structure](#️-database-structure)  
- [🔗 API Endpoints](#-api-endpoints)  
- [🔒 Security Highlights](#-security-highlights)  
- [🖼️ Storage Integration](#️-storage-integration)  
- [⚙️ Getting Started](#️-getting-started)

---

## 🔍 Overview

A rating and proposal submission platform tailored for contractors and tender management. Features include authentication, store management, and rating analytics.

---

## 🧱 Tech Stack

**Frontend**

- ⚛️ React + Vite  
- 🎨 Tailwind CSS  
- 📱 Responsive UI

**Backend**

- 🟢 Node.js + Express  
- 🐘 PostgreSQL  
- 🌐 REST API  
- 🪣 Supabase (for file storage)

---

## 🔐 Authentication Flow

- Role-based login: `user`, `contractor`, `admin`  
- Protected API routes based on roles  
- Profile image upload via Supabase  
- JWT authentication (customizable)

---

## 👤 User Features

- 🔍 Browse companies with filter/search  
- ⭐ Rate companies (1–5 stars) with optional proposal  
- 📝 View/edit profile & upload profile image  
- 📊 Dashboard to track submissions

---

## 🏢 Contractor Features

- 🏪 Create and manage their own companies  
- 📈 See all ratings/proposals for their companies  
- 👥 View users who rated them  
- ✏️ Update store details anytime

---

## 🛠️ Admin Features

- 👥 View, create, and manage users  
- 🏪 View and assign stores to contractors  
- 📊 View system-wide stats: user/store/rating count  
- 🔍 Moderate rating activity

---

## 🗄️ Database Structure

### `users` table

- `id` (Primary Key)  
- `name`  
- `email` (unique)  
- `address`  
- `password`  
- `role` (`admin`, `contractor`, `user`)  
- `profile_image_url`  
- `created_at` (timestamp)

### `companies` table

- `id` (Primary Key)  
- `name`  
- `email`  
- `address`  
- `owner_user_id` (Foreign Key → users.id)  
- `created_at` (timestamp)

### `applications` table

- `id` (Primary Key)  
- `company_id` (Foreign Key → companies.id)  
- `user_id` (Foreign Key → users.id)  
- `rating` (1–5 decimal)  
- `comment` (optional)  
- `proposal` (optional)  
- `created_at` (timestamp)

---

## 🔗 API Endpoints

### Authentication

- `POST /api/auth/register` – Register a new user  
- `POST /api/auth/login` – Login existing user  
- `PUT /api/auth/password` – Update password  
- `POST /api/auth/profile-image` – Upload profile image  
- `GET /api/auth/profile/:userId` – Get user profile

### User

- `GET /api/user/stores` – Get all companies with user rating status  
- `POST /api/user/stores/:storeId/rate` – Submit or update a rating

### Admin

- `GET /api/admin/users` – List all users  
- `GET /api/admin/users/:id` – Get user details  
- `POST /api/admin/users` – Create new user  
- `GET /api/admin/stores` – List all stores  
- `POST /api/admin/stores` – Create a store  
- `GET /api/admin/stores/owner/:ownerId` – Get stores by contractor  
- `GET /api/admin/stores/:storeId/ratings/users` – Users who rated a store

---

## 🔒 Security Highlights

- ✅ Input validation (server-side)  
- 🔐 Role-based route protection  
- 🚫 CORS and secure headers  
- ⚠️ Plaintext password warning (consider hashing)  
- 🧪 Optional: login event logging

---

## 🖼️ Storage Integration (Supabase)

- Upload base64 profile image  
- Stored in `profile-images` bucket  
- Filename format: `userId_timestamp`  
- Public URL saved in database  
- Easy frontend image rendering

---

## ⚙️ Getting Started

### Prerequisites

- Node.js v14+  
- PostgreSQL  
- Supabase account

## Demo Screenshot

<img src="https://github.com/sunilsonumonu12/Demo/blob/b8a4a5cb29fd2d2d8f689102f7a3a9387492bb44/image.png?raw=true" alt="image alt" width="400"/>

