# EduFlow — Student Task and Activity Management System

EduFlow is a web-based student task and activity management system designed to help students and student organizations organize, monitor, and manage curricular, extracurricular, and organization-assigned responsibilities in a single, unified platform.

---

## 🎨 Color Palette

| Preview | Hex Code | Role |
| :--- | :--- | :--- |
| Main Background | `#FFFFFF` | Main Background |
| Cards / Sections | `#CDB4DB` | Sections & Cards |
| Accents | `#FFC8DD` | Accents |
| Highlights & Hover | `#FFAFCC` | Highlights & Hover |
| Secondary Accents | `#BDE0FE` | Secondary Accents |
| Illustrations | `#A2D2FF` | Illustrations & Decorations |
| Text & CTA | `#2B1B3D` | Text & Primary CTA Buttons |

---

## 🚀 Technology Stack

- **Frontend**: React.js, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js, Express.js (REST API)
- **Database**: SQLite / JSON DB (with PostgreSQL Schema compatibility)
- **Auth & Security**: JWT (JSON Web Tokens), bcryptjs password hashing

---

## 📁 Project Structure

```
EduFlow/
├── server/
│   ├── config/
│   │   └── db.js            # Database connection & schema
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js          # /api/auth (register, login, me)
│   │   ├── organizations.js # /api/organizations (create, join, members)
│   │   └── tasks.js         # /api/tasks (CRUD, member status updates)
│   ├── server.js            # Express server entry point (Port 5000)
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.jsx     # Public visitor page
│   │   │   ├── AuthModal.jsx       # Login & Register modal
│   │   │   ├── Navbar.jsx          # App header & org badges
│   │   │   ├── Sidebar.jsx         # Section 13 menu hierarchy
│   │   │   ├── Dashboard.jsx       # Quotes, stats, quick add, weekly tasks
│   │   │   ├── TaskViews.jsx       # Curricular, Extracurricular, Org task lists
│   │   │   ├── CalendarView.jsx    # Interactive month/week calendar grid
│   │   │   ├── UpcomingTasks.jsx   # Overdue & deadline sorting
│   │   │   ├── OrganizationView.jsx# Org roster & join code generator
│   │   │   ├── ProfileView.jsx     # Account profile & stats summary
│   │   │   └── TaskModal.jsx       # Create/Edit task modal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Global auth state
│   │   │   └── TaskContext.jsx     # Global task state & dynamic reminders
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
│
└── package.json            # Root workspace scripts
```

---

## 💻 How to Run the Application

### 1. Start Backend API Server
```bash
cd server
npm start
```
*Server runs at http://localhost:5000*

### 2. Start Frontend Client
```bash
cd client
npm run dev
```
*Client opens at http://localhost:3000*

---

## 🔑 Account Types & Features

1. **Individual Student**: Personal task management for Curricular requirements (assignments, quizzes, exams) and Extracurricular activities.
2. **Organization Admin**: Create organizations, generate unique 6-character Join Codes, assign tasks to members, and manage team workloads.
3. **Organization Member**: Join organizations using a Join Code, view organization-assigned tasks, and update task progress (`Pending` ➔ `In Progress` ➔ `Completed`).

---

## 📄 License
Created for EduFlow Student Task & Activity Management System.
