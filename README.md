# EduFlow

EduFlow is a React/Vite student task manager with an Express API and a Supabase-hosted PostgreSQL database. It supports personal, curricular, extracurricular, and organization-assigned tasks, plus a calendar, dashboard, offline task cache, theme switching, and installable PWA shell.

## Runtime architecture

```text
Browser (React/Vite PWA)
  ├─ / and static assets ───────────────> Vercel static output (client/dist)
  └─ /api/* + Bearer JWT ──────────────> Vercel Function (api/index.js)
                                             └─ server/app.js
                                                  ├─ auth routes
                                                  ├─ organization routes
                                                  └─ task routes
                                                       └─ pg Pool
                                                            └─ Supabase Postgres
```

The browser never receives the database URL. All SQL runs on the server through parameterized queries. Supabase Row Level Security is enabled with no public policies because the application does not use the Supabase Data API; the server connects directly to Postgres.

## Repository map

```text
EduFlow/
├─ api/
│  └─ index.js                 Vercel Function entrypoint; exports the shared Express app
├─ client/
│  ├─ index.html               Vite HTML entry and PWA metadata
│  ├─ package.json             React/Vite/Tailwind dependencies and scripts
│  ├─ package-lock.json        Reproducible client dependency graph
│  ├─ postcss.config.js        Tailwind/Autoprefixer PostCSS setup
│  ├─ tailwind.config.js       EduFlow colors, dark mode, and animation tokens
│  ├─ vite.config.js           Dev server on :5050; proxies /api to :5000
│  ├─ public/
│  │  ├─ manifest.json         Installable PWA manifest
│  │  ├─ sw.js                 Static-shell caching; deliberately excludes /api
│  │  └─ logo/favicon assets   Application icons (source PNG is 1024×1024)
│  └─ src/
│     ├─ main.jsx              React providers and service-worker registration
│     ├─ App.jsx               Auth gate, app shell, navigation, and task-modal state
│     ├─ index.css             Tailwind layers and base styles
│     ├─ assets/logo.png       Bundled logo source
│     ├─ context/
│     │  ├─ AuthContext.jsx    Login, registration, session restore, and organization actions
│     │  ├─ TaskContext.jsx    Task API operations, statistics, and per-user offline cache
│     │  └─ ThemeContext.jsx   Light/dark preference persistence
│     ├─ utils/
│     │  └─ dates.js           Local-calendar date parsing/formatting without UTC drift
│     └─ components/
│        ├─ AuthModal.jsx      Sign-in and account-registration form
│        ├─ CalendarView.jsx   Monthly/weekly task calendar and selected-task detail
│        ├─ CustomDatePicker.jsx Visual date input and quick date choices
│        ├─ CustomSelect.jsx   Reusable styled select menu
│        ├─ Dashboard.jsx      Summary cards, quick-add form, quote, and recent tasks
│        ├─ LandingPage.jsx    Public marketing/entry page
│        ├─ Navbar.jsx         Top navigation, theme/PWA controls, and account menu
│        ├─ OrganizationView.jsx Organization creation/joining, code, and member roster
│        ├─ ProfileView.jsx    Account and productivity summary
│        ├─ Sidebar.jsx        Desktop/mobile section navigation
│        ├─ TaskModal.jsx      Create/edit task form and organization assignment
│        ├─ TaskViews.jsx      Filtered task lists, status actions, edit, and delete
│        └─ UpcomingTasks.jsx  Overdue/today/upcoming grouped task view
├─ server/
│  ├─ app.js                   Shared middleware, API mounts, DB-aware health, JSON errors
│  ├─ server.js                Local server, static client hosting, and SPA fallback
│  ├─ config/db.js             PostgreSQL pool, placeholder adapter, and transactions
│  ├─ middleware/auth.js       HS256 Bearer-token validation
│  ├─ routes/auth.js           Register, login, and current-user endpoints
│  ├─ routes/organizations.js  Create/join organization and list members
│  ├─ routes/tasks.js          Authorized task CRUD and validation
│  ├─ tests/app.test.js        API health, auth guard, JSON error, and 404 smoke tests
│  ├─ package.json             Standalone local-server dependencies
│  ├─ package-lock.json        Reproducible server dependency graph
│  └─ data.example.json        Legacy sample data; not used by PostgreSQL runtime
├─ supabase/
│  └─ migrations/
│     ├─ 20260904134036_eduflow_schema.sql             Core tables, keys, indexes, and RLS
│     └─ 20260904143901_harden_eduflow_constraints.sql Scope checks and missing FK indexes
├─ .env.example               Required environment-variable template
├─ .gitignore                 Secrets, dependencies, builds, Vercel/Supabase temp state
├─ package.json               Vercel/root runtime dependencies and workspace scripts
├─ package-lock.json          Reproducible Vercel/root dependency graph
├─ start-eduflow.bat          Windows local-development launcher
└─ vercel.json                Vite build output and SPA/API rewrites
```

## Data model

- `users`: application identities, bcrypt password hashes, account type, and optional organization membership.
- `organizations`: organization name, unique eight-character join code, creator, and creation time.
- `tasks`: owner, optional organization assignee, type, due date/time, priority, status, and timestamps.

Organization tasks must have an organization. Personal/curricular/extracurricular tasks cannot be assigned to another user. Foreign keys clean up or detach dependent rows according to the migration rules.

## API map

| Method | Path | Authentication | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | No | Confirms both API and database availability |
| `POST` | `/api/auth/register` | No | Creates an individual, organization member, or admin account |
| `POST` | `/api/auth/login` | No | Verifies credentials and returns a seven-day JWT |
| `GET` | `/api/auth/me` | Bearer JWT | Returns the current database-backed profile |
| `POST` | `/api/organizations` | Bearer JWT | Atomically creates an organization and promotes its creator |
| `POST` | `/api/organizations/join` | Bearer JWT | Joins an organization by code |
| `GET` | `/api/organizations/members` | Bearer JWT | Lists members of the caller's organization |
| `GET` | `/api/tasks` | Bearer JWT | Lists tasks visible to the caller |
| `POST` | `/api/tasks` | Bearer JWT | Creates a personal or admin-owned organization task |
| `PUT` | `/api/tasks/:id` | Bearer JWT | Updates an authorized task; assignees may change status only |
| `DELETE` | `/api/tasks/:id` | Bearer JWT | Deletes a task as its owner or organization admin |

## Configuration

Copy `.env.example` to `.env` for local development and provide:

- `DATABASE_URL`: a complete, percent-encoded Supabase Postgres connection URL containing the password. For serverless traffic, use the transaction pooler URL (normally port `6543`).
- `JWT_SECRET`: a cryptographically random value of at least 32 characters.
- `CORS_ORIGIN`: optional comma-separated external origins. Leave blank for the normal same-origin Vercel deployment.

Vercel variables are environment-scoped. Configure required values for Production and separately for Preview/Development when those deployments need a working API.

## Local development

```powershell
npm install
npm --prefix client install
npm --prefix server install
npm run start:server
npm run start:client
```

Apply migrations through the Supabase CLI before using the API. The Vite app runs on `http://localhost:5050` and proxies API calls to the Express server on `http://localhost:5000`.

## Verification

```powershell
npm run build
npm test
node --check api/index.js
node --check server/app.js
node --check server/server.js
npx supabase db advisors --linked --type all
npx vercel env ls
```
