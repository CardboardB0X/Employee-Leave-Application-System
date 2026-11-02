# Enterprise Employee Leave Application System

A production-grade, highly secure Employee Leave Application System built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **MySQL 8+** (via **Prisma ORM**).

---

## 🛡️ Security Architecture & Strict Protocols

### 1. Role-Based Access Control (RBAC) Matrix
The system strictly enforces role boundaries across both API endpoints and Edge middleware:

| Role | Permissions & Scoping |
| :--- | :--- |
| **`SUPER_ADMIN`** | Unrestricted access: Provision user accounts, manage departments, adjust leave quotas, inspect immutable audit logs, review & override all leave requests. |
| **`HR_ADMIN`** | Organization-wide leave oversight, final endorsement for statutory/extended leaves (Maternity, Paternity, Unpaid), quota allocations, audit log inspection. |
| **`MANAGER`** | Department-scoped authority: Review, approve, or reject subordinate leave requests, monitor department team calendar coverage, apply for personal leaves. |
| **`EMPLOYEE`** | Personal access only: View personal leave balances, submit leave applications, cancel pending requests, view department calendar schedule. |

### 2. OWASP Top 10 Protections Implemented
- **Broken Object Level Authorization (BOLA / IDOR)**: Every leave record and balance query enforces strict ownership verification in `src/lib/rbac.ts`. Subordinate and department boundaries are verified server-side.
- **SQL Injection (SQLi)**: 100% parameterized queries via Prisma ORM. No raw concatenated strings.
- **Brute-Force & Credential Stuffing Mitigation**: Automatic account lockout after 5 consecutive failed login attempts for 15 minutes. Reset on successful login.
- **Password Security**: Strong cryptographic password hashing using `bcryptjs` with high cost factors.
- **Session Security**: Session tokens encoded with `jose` (HS256) and delivered over secure `HttpOnly; SameSite=Lax` cookies, neutralizing XSS session theft.
- **Race Condition Prevention in Balances**: Quota deduction executes inside a MySQL `TRANSACTION` with atomic balance updates (`pendingDays` hold -> `usedDays` upon approval).
- **Immutable Audit Logging**: Every sensitive action (logins, lockouts, approvals, rejections, manual quota adjustments) writes to an append-only `audit_logs` table with actor, IP address, and timestamp.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (verified on v22.16.0)
- **MySQL**: 8.0 or 8.4+ running on `localhost:3306`

### 1. Environment Configuration
The database connection string and JWT secret are configured in `.env`:
```env
DATABASE_URL="mysql://root:@localhost:3306/employee_leave_db"
JWT_SECRET="c8f18d76d49e1e2d9b2e7a3b4f9c1e6a0d2f4e8a1c3b5d7e9f0a2c4e6b8d0f1a"
NODE_ENV="development"
PORT=3000
```

### 2. Database Sync & Seeding
```bash
# Push schema to MySQL database
npx prisma db push

# Seed initial roles, leave types, departments, and demo accounts
npm run db:seed
```

### 3. Running the Application
```bash
# Development mode
npm run dev

# Or Production mode
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Seeded Demo Accounts (Password for all: `Password123!`)

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@company.com` | `Password123!` | System-wide administrator |
| **HR Admin** | `hr@company.com` | `Password123!` | Global leave & quotas manager |
| **Department Manager** | `manager@company.com` | `Password123!` | Engineering Department supervisor |
| **Employee** | `employee@company.com` | `Password123!` | Engineering Department engineer |
| **Employee 2** | `liam@company.com` | `Password123!` | Engineering Department engineer |

*(The login screen also features 1-click quick-fill selector buttons for each role).*

---

## 📂 Key Architecture Directories

```
├── prisma/
│   ├── schema.prisma            # MySQL DDL models, enums & relational constraints
│   └── seed.js                  # Database seeder with roles, leave types & demo users
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/            # Login (rate-limited/lockout), Logout, Me
│   │   │   ├── leaves/          # Leave CRUD & approval actions (atomic transactions)
│   │   │   ├── balances/        # Leave quota management & adjustment endpoints
│   │   │   ├── calendar/        # Team schedule & conflict detection
│   │   │   └── admin/           # User provisioning & audit log inspection
│   │   ├── dashboard/           # Minimalist corporate dashboard & sub-views
│   │   ├── login/               # Secure login portal
│   │   ├── globals.css          # Tailwind CSS styles
│   │   └── layout.tsx           # Base layout
│   ├── components/              # Sidebar, Header, ApplyLeaveModal, ApprovalModal
│   ├── lib/
│   │   ├── auth.ts              # Bcrypt, JWT, cookie session & lockout logic
│   │   ├── audit.ts             # Append-only audit logger
│   │   ├── db.ts                # Prisma MySQL singleton
│   │   ├── leave-calculator.ts  # Working day calculator & conflict checker
│   │   └── rbac.ts              # Strict role hierarchy & BOLA/IDOR validators
│   └── middleware.ts            # Edge route protection & security headers
```
