# 💰 FinTracker - Finance Tracker Web App

A modern, full-stack finance tracker and expense splitter web application. Create groups, track shared expenses, split bills fairly, and settle up with friends — all in one place.

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4.0-FF6384?style=flat&logo=chart.js&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.x-5A29E4?style=flat&logo=axios&logoColor=white)

---

## 🌐 Live Demo

- **Frontend:** [https://your-vercel-url.vercel.app](https://your-vercel-url.vercel.app)
- **Backend API:** [https://finance-tracker-backend-wy1h.onrender.com](https://finance-tracker-backend-wy1h.onrender.com)

---

## ✨ Features

### 🔐 Authentication
- User registration & login
- JWT-based authentication with access & refresh tokens
- Persistent login sessions
- Secure logout

### 📊 Dashboard
- Financial overview with stats cards
- Interactive **Doughnut Chart** — expenses by group
- Interactive **Bar Chart** — your contribution per group
- Group status badges (settled / owes / owed)
- Quick navigation to groups

### 👥 Groups Management
- Create groups with name, description & currency
- Add/remove members using User ID
- Leave or delete groups
- Search & filter groups
- Multi-currency support (INR, USD, EUR, GBP)

### 💸 Expense Tracking
- Add expenses with description, amount & category
- **7 Categories:** Food, Groceries, Transport, Rent, Utility, Entertainment, Other
- **3 Split Types:**
  - **Equal** — split evenly among all members
  - **Exact** — specify exact amount per person
  - **Percentage** — split by percentage
- Search expenses with debounced input
- Pagination support
- Delete expenses

### 💰 Balances & Settlements
- Real-time balance tracking per group
- Visual indicators (green = gets back, red = owes)
- Record settlements between members
- Settlement history

### 👤 Profile
- Update username
- Upload avatar (Cloudinary integration)
- Copy User ID for sharing with friends
- View account details & join date

### 🌙 Dark Mode
- Toggle between light & dark themes
- Persists across sessions
- Smooth transitions
- All pages fully themed

### 📱 Responsive Design
- Mobile-first approach
- Works on desktop, tablet & mobile
- Collapsible mobile navigation
- Touch-friendly interactions

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | React 18 |
| **Styling** | Tailwind CSS 3 |
| **Charts** | Chart.js + react-chartjs-2 |
| **Routing** | React Router v6 |
| **HTTP Client** | Axios |
| **State Management** | React Context API |
| **Notifications** | React Hot Toast |
| **Icons** | React Icons (Feather) |
| **Deployment** | Vercel |

---

## 📁 Project Structure

finance-tracker-frontend/
├── public/
│ ├── index.html
│ └── vercel.json
├── src/
│ ├── assets/
│ ├── components/
│ │ ├── Loader.jsx # Loading spinner component
│ │ ├── Navbar.jsx # Navigation bar with dark mode toggle
│ │ └── ProtectedRoute.jsx # Auth route guard
│ ├── context/
│ │ └── AuthContext.jsx # Authentication & dark mode context
│ ├── pages/
│ │ ├── Login.jsx # Login page
│ │ ├── Register.jsx # Registration page
│ │ ├── Dashboard.jsx # Dashboard with charts
│ │ ├── Groups.jsx # Groups list & create
│ │ ├── GroupDetail.jsx # Group detail with tabs
│ │ ├── CreateExpense.jsx # Add expense form
│ │ └── Profile.jsx # User profile management
│ ├── utils/
│ │ └── api.js # Axios instance & API functions
│ ├── App.jsx # Main app with routing
│ ├── index.js # Entry point
│ └── index.css # Global styles & Tailwind
├── .env
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md


## 🚀 Getting Started

### Prerequisites

- Node.js 16+ installed
- Backend API running ([Backend Repo](https://github.com/iamyash07/finance-tracker-backend))

### Installation
