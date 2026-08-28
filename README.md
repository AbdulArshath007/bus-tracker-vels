<div align="center">
  <img src="https://vistas.ac.in/wp-content/uploads/2026/08/vels-logo.jpg" alt="VELS Logo" width="300" />
  <h1>VELS University Bus Tracker</h1>
  <p>A comprehensive real-time tracking solution for VELS University's transportation fleet.</p>
</div>

---

## 📌 Overview
The **VELS Bus Tracker** is a complete, real-time geographic tracking and management system designed to monitor the university's bus fleet. It improves safety, streamlines administrative monitoring, and provides real-time location insights to students and staff.

**Live Admin Portal:** [https://abdularshath007.github.io/bus-tracker-vels/](https://abdularshath007.github.io/bus-tracker-vels/)  
**Driver App Release (APK):** [v1.0.0-debug Release](https://github.com/AbdulArshath007/bus-tracker-vels/releases/tag/v1.0.0-debug)

---

## 🏗️ System Architecture & Monorepo Structure
The system uses a modern decoupled architecture across three main components housed in this monorepo:

### 1. Backend (`/backend`)
A high-performance REST API and WebSocket server built with **NestJS**, orchestrating real-time GPS streams and managing the core database.
- **Framework:** NestJS (Node.js/TypeScript)
- **Database:** Prisma ORM connected to PostgreSQL
- **Real-time Engine:** Socket.IO for broadcasting live driver locations
- **Authentication:** JWT-based robust authentication
- **Features:** 
  - Manage Users, Drivers, Students, and Routes
  - In-memory WebSocket broadcasting of geographic data
  - Moderated live chat rooms support

### 2. Admin Web Portal (`/admin-portal`)
A responsive, React-based dashboard for fleet administrators to oversee active buses, moderate chat, and manage users.
- **Framework:** React 19 + Vite (TypeScript)
- **Styling:** Custom CSS (Dark/Light mode support), Lucide Icons
- **Mapping:** Leaflet & OpenStreetMap for live tracking UI
- **Features:** 
  - Live Map showing all active buses in real-time
  - Responsive design (Mobile-friendly Drawer & Layouts)
  - Data grids for Users & Routes management
  - Live Chat Moderation interface
  - **Deployed globally** via GitHub Pages actions.

### 3. Driver Mobile Application (`/driver-app-flutter`)
A robust mobile application carried by bus drivers to broadcast their location and interact with the system.
- **Framework:** Flutter & Dart
- **State Management:** Riverpod
- **Mapping:** `flutter_map`
- **Features:** 
  - Real-time GPS location broadcasting to the server
  - Seamless "Start Ride" and "End Ride" swipe mechanics
  - Profile Management (Name, Phone, Email editing)
  - Interactive Route Map
  - Secure offline session storage and JWT injection

---

## 🚀 Key Features

* **Sub-second Real-time Tracking**: Optimized Socket.IO bridges direct communication from the Driver App's GPS listener directly to the Admin Portal.
* **Responsive UI Design**: Both the Flutter app and React web portal are designed for modern aesthetics, implementing dark mode, skeleton loaders, and interactive components.
* **Role-Based Access Control**: Secure login mechanisms segregating Administrators, Drivers, and general Users/Guests.
* **Automated Deployments**: The Web Admin Portal features a fully automated CI/CD pipeline using **GitHub Actions** deploying straight to GitHub Pages.

---

## 🛠️ Getting Started (Local Development)

### Prerequisites
- Node.js (v20+)
- Flutter SDK (v3.27+)
- PostgreSQL Database
- Redis (Optional for scaling Socket.IO)

### Backend Setup
```bash
cd backend
npm install
# Configure your .env (DATABASE_URL, JWT_SECRET, etc.)
npx prisma generate
npm run start:dev
```

### Admin Portal Setup
```bash
cd admin-portal
npm install
# Configure your .env (VITE_API_URL, VITE_SOCKET_URL)
npm run dev
```

### Driver App Setup
```bash
cd driver-app-flutter
flutter pub get
# Update lib/app_config.dart with local IP for dev testing
flutter run
```

---
*Built for VELS Institute of Science, Technology & Advanced Studies (VISTAS).*
