# AssetFlow

**Enterprise Asset & Resource Management System** — a centralized ERP platform to track, allocate, and maintain physical assets and shared resources across any organization (offices, hospitals, schools, factories).

Built in an 8-hour hackathon sprint. Full-stack MERN application with real role-based workflows, conflict-safe allocation and booking, and a complete asset lifecycle engine.

---

## The Problem

Most organizations still track assets — laptops, vehicles, furniture, meeting rooms — using spreadsheets and paper logs. This leads to:
- No single source of truth for "who has what, right now"
- Double-booking of shared resources
- Repairs starting without approval
- Assets going missing with no audit trail

AssetFlow replaces all of this with one system of record, where every asset has a real-time status and every state change follows an enforced business rule — not a manual note in a spreadsheet.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Tailwind CSS, Axios |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT stored in an HTTP-only cookie, Role-Based Access Control middleware |
| Icons | lucide-react |

---

## Core Architecture Principle

Every asset has a single `status` field — `Available`, `Allocated`, `Reserved`, `Under Maintenance`, `Lost`, `Retired`, `Disposed` — that acts as the single source of truth for the entire system.

**No workflow ever edits this field directly.** Every module that touches an asset's lifecycle follows the same pattern:

```
validate business rule → create a transactional record → flip Asset.status
```

This one pattern is repeated consistently across Allocation, Booking, Maintenance, and Audit — which is what keeps the codebase predictable instead of having asset state scattered across ad-hoc updates.

---

## Features Implemented

### Authentication & RBAC
- Signup creates an **Employee account only** — no self-elevated roles
- Admin is the only one who can promote an Employee to **Department Head** or **Asset Manager**, exclusively via the Employee Directory
- JWT-based sessions via HTTP-only cookies
- Role-gated middleware (`protect` + `requireRole`) on every write endpoint

### Organization Setup
- Department management with hierarchy (parent department, department head)
- Asset category management
- Employee Directory with role promotion (admin-only)

### Asset Registry
- Auto-generated sequential asset tags (`AF-0001`, `AF-0002`, ...)
- Search and filter by tag, name, serial number, category, status, department, location
- Full per-asset allocation + maintenance history

### Allocation & Transfer
- **Conflict-blocked allocation**: an asset already held by someone cannot be allocated again — the requester is shown who currently holds it and offered a transfer request instead
- Transfer workflow: `Requested → Approved/Rejected`, with allocation history preserved (not overwritten) across every transfer
- Return flow captures condition notes and frees the asset back to `Available`

### Resource Booking
- Time-slot booking for shared/bookable resources (rooms, vehicles, equipment)
- Real overlap validation: a request overlapping an existing booking is rejected; a request starting exactly when another ends is allowed
- Cancel and reschedule (reschedule re-validates for new conflicts)

### Maintenance Management
- Full approval workflow: `Pending → Approved/Rejected → Technician Assigned → In Progress → Resolved`
- Asset flips to `Under Maintenance` only on approval, and back to `Available` only on resolution — never before

### Asset Audit
- Create an audit cycle scoped by department/location and date range
- Auto-generates a checklist item for every matching asset
- Assigned auditors mark each item `Verified / Missing / Damaged`
- Auto-generated discrepancy report (missing + damaged items)
- Closing a cycle locks it and updates real asset statuses — confirmed-missing assets become `Lost`

### Reports & Analytics
- Department-wise utilization (% of assets currently allocated)
- Maintenance frequency trend (last 8 weeks)
- Most-used vs. idle assets, computed from real allocation/booking counts
- Assets flagged for attention (poor condition or nearing 3 years old)
- CSV export of the full asset register

### Notifications
- Per-user notification feed (asset assigned, maintenance approved/rejected, booking confirmed/cancelled, transfer approved, overdue return, audit discrepancy)
- Mark as read / mark all as read

---

## Business Rules Enforced

- ✅ Asset tags are unique and auto-generated
- ✅ An asset cannot be allocated to two people/departments at once
- ✅ Two bookings for the same resource cannot overlap
- ✅ Maintenance work cannot begin before approval
- ✅ Roles can only be assigned by an Admin — never self-selected at signup
- ✅ Retired/Disposed assets are excluded from allocation, booking, and new audits
- ✅ Audit results (Missing) directly update real asset status on cycle close

---

## Folder Structure

```
ASSETFLOW/
├── backend/
│   └── src/
│       ├── models/         # Mongoose schemas (11 total)
│       ├── controllers/    # Business logic per module
│       ├── routes/         # Express route definitions
│       ├── middlewares/    # JWT auth + role-based access control
│       ├── config/         # DB connection
│       └── utils/          # One-off scripts (e.g. admin seeding)
├── frontend/
│   └── src/
│       ├── pages/          # One page per module (Dashboard, Assets, Audit, etc.)
│       ├── components/     # Shared Sidebar, ProfileMenu
│       ├── hooks/          # useAuth (current user + logout)
│       └── utils/          # BASE_URL constant
└── README.md
```

---

## API Overview

| Module | Base route |
|---|---|
| Auth | `/api/auth` — signup, login, logout, me, forgot-password |
| Users | `/api/users` — employee directory, role promotion |
| Departments | `/api/departments` |
| Categories | `/api/categories` |
| Assets | `/api/assets` — register, search, history, retire |
| Allocations | `/api/allocations` — allocate, return |
| Transfers | `/api/transfers` — request, approve, reject |
| Bookings | `/api/bookings` — create, cancel, reschedule |
| Maintenance | `/api/maintenance` — raise, approve, assign, resolve |
| Audits | `/api/audits` — create cycle, record results, discrepancy report, close |
| Dashboard | `/api/dashboard` — aggregated KPIs and activity feed |
| Reports | `/api/reports` — analytics, CSV export |
| Notifications | `/api/notifications` |

---

## Running the Project

### Backend
```bash
cd backend
npm install
cp .env.example .env    # fill in MONGO_URI and JWT_SECRET
node src/utils/seedAdmin.js   # creates the first Admin account
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Suggested Demo Flow

1. Log in as the seeded Admin
2. Create a Department and an Asset Category (Organization Setup)
3. Register an asset — watch it get tagged `AF-0001` automatically
4. Promote an employee to **Asset Manager** via the Employee Directory
5. Allocate the asset to an employee → try allocating it again as someone else → see it blocked with a transfer suggestion
6. Book a shared resource for a time slot → try an overlapping slot → see it rejected
7. Raise a maintenance request → approve it → watch the asset flip to `Under Maintenance` → resolve it → watch it return to `Available`
8. Create an audit cycle → mark an item `Missing` → close the cycle → confirm the asset status updates to `Lost`
9. View the Reports page and export the CSV

---

## Future Scope

- Email notifications (currently in-app only)
- QR code scanning for asset check-in/out
- Mobile-responsive polish
- Department-wise ESG-style sustainability scoring for shared vehicles/equipment
- PDF export alongside CSV

---

## Team

Anurag Yadav (Leader,https://github.com/anurag435)

Ashish Kumar Ojha (https://github.com/ashish0jha)
