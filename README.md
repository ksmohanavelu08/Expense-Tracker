# 💰 Bellcorp Personal Expense Tracker

A full-stack **MERN** web application for managing personal finances — built with React.js, Node.js, Express, and MongoDB.

---

## 🚀 Features

### Authentication
- ✅ User registration with validation
- ✅ Secure login with JWT authentication
- ✅ Protected routes (unauthenticated users redirected to login)
- ✅ Session persistence via localStorage

### Transaction Management
- ✅ Add new transactions (expense or income)
- ✅ Edit existing transactions (pre-filled form)
- ✅ Delete with confirmation prompt
- ✅ View detailed transaction drawer
- Fields: **Title, Amount, Category, Date, Notes, Type**

### Transaction Explorer
- ✅ Paginated list with **infinite scroll** (loads 15 at a time)
- ✅ **Full-text search** across title and notes (debounced)
- ✅ Filter by category, type, date range, amount range
- ✅ Sort by date, amount, or title
- ✅ **Scroll position preserved** when navigating back from detail view
- ✅ Empty state with clear feedback

### Dashboard
- ✅ Summary stats: Total Expenses, Total Income, Net Balance, Transaction Count
- ✅ Period selector (Week / Month / Year / All Time)
- ✅ **Category breakdown** with doughnut chart
- ✅ **6-month bar chart** trend (expenses vs income)
- ✅ Recent transactions preview

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, React Router v6 |
| Styling | Custom CSS with CSS Variables |
| Charts | Chart.js + react-chartjs-2 |
| HTTP Client | Axios |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Validation | express-validator |
| Notifications | react-hot-toast |

---

## 📁 Project Structure

```
bellcorp-expense-tracker/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/
│   │   └── auth.js               # JWT protect middleware
│   ├── models/
│   │   ├── User.js               # User schema (bcrypt hashing)
│   │   └── Transaction.js        # Transaction schema + indexes
│   ├── routes/
│   │   ├── auth.js               # /api/auth/* endpoints
│   │   └── transactions.js       # /api/transactions/* endpoints
│   ├── .env.example
│   ├── package.json
│   └── server.js                 # Express app entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── assets/
        │   └── styles.css        # Global design system
        ├── components/
        │   ├── auth/
        │   │   └── ProtectedRoute.js
        │   └── common/
        │       ├── Sidebar.js / .css
        │       ├── TransactionModal.js
        │       └── ConfirmModal.js
        ├── context/
        │   ├── AuthContext.js    # Auth state + login/logout
        │   └── TransactionContext.js  # Transaction state + CRUD
        ├── pages/
        │   ├── Login.js / Auth.css
        │   ├── Register.js
        │   ├── Dashboard.js / .css
        │   ├── Explorer.js / .css
        │   └── Profile.js / .css
        ├── utils/
        │   ├── api.js            # Axios instance + interceptors
        │   └── helpers.js        # Formatters, constants
        ├── App.js                # Router + providers
        └── index.js
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com))
- npm or yarn

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd bellcorp-expense-tracker
```

### 2. Configure Backend
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/expense-tracker
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker
JWT_SECRET=your_very_long_secret_key_here_change_this
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Install dependencies
```bash
# From the root
cd backend && npm install
cd ../frontend && npm install
```

### 4. Run in development
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm start
```

App will be at **http://localhost:3000**
API at **http://localhost:5000/api**

---

## 🌐 API Reference

### Auth Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login + get token | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update profile | Private |

### Transaction Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/transactions` | List (paginated, filtered) | Private |
| POST | `/api/transactions` | Create transaction | Private |
| GET | `/api/transactions/summary` | Dashboard summary | Private |
| GET | `/api/transactions/:id` | Get single transaction | Private |
| PUT | `/api/transactions/:id` | Update transaction | Private |
| DELETE | `/api/transactions/:id` | Delete transaction | Private |

#### Query Parameters (GET /api/transactions)
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 15, max: 50) |
| `search` | string | Search title/notes |
| `category` | string | Filter by category |
| `type` | string | `expense` or `income` |
| `startDate` | ISO date | Filter from date |
| `endDate` | ISO date | Filter to date |
| `minAmount` | number | Minimum amount |
| `maxAmount` | number | Maximum amount |
| `sortBy` | string | `date`, `amount`, `title` |
| `sortOrder` | string | `asc` or `desc` |

---

## 🚀 Deployment

### Backend (Render)
1. Create a new **Web Service** on Render
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables:
   - `MONGO_URI` → your MongoDB Atlas connection string
   - `JWT_SECRET` → a long random string
   - `FRONTEND_URL` → your Vercel frontend URL

### Frontend (Vercel)
1. Create a new project on Vercel
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   - `REACT_APP_API_URL` → `https://your-backend.onrender.com/api`
4. Deploy

---

## 🗄️ Database Design

### User Collection
```js
{
  _id: ObjectId,
  name: String,          // required
  email: String,         // unique, indexed
  password: String,      // bcrypt hashed, not returned in queries
  currency: String,      // default "USD"
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Collection
```js
{
  _id: ObjectId,
  userId: ObjectId,      // ref: User, indexed
  title: String,         // required, max 100
  amount: Number,        // required, positive
  type: String,          // "expense" | "income"
  category: String,      // enum of 12 categories
  date: Date,            // required, indexed
  notes: String,         // optional, max 500
  tags: [String],        // optional
  createdAt: Date,
  updatedAt: Date
}
// Compound index: { userId, date }
// Text index: { title, notes } for search
```

---

## 📋 Available Categories

Food & Dining · Transport · Housing & Rent · Healthcare · Entertainment · Shopping · Education · Travel · Utilities · Investments · Income · Other

---

## 📝 License

Built for Bellcorp Studio assignment. All rights reserved.
