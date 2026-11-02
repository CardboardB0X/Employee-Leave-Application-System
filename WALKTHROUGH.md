# Walkthrough — Outcrowd UI Overhaul & Enterprise Enhancements

The Employee Leave Application System has been upgraded with a comprehensive **Outcrowd design system overhaul** and robust enterprise features.

---

## 🌟 What Was Built & Upgraded

### 1. Outcrowd 3-Column Floating Island Architecture
* **Framed Ambient Shell**: The dashboard is contained within an ambient canvas frame (`#EDF0F8` with radial gradient lighting).
* **Floating Island Dock**: Detached capsule sidebar (`rounded-4xl shadow-elevated`) with glowing brand glyph, pill navigation with micro-elevations, and integrated profile chip.
* **Hero Greeting Banner**: Outcrowd gradient hero card (`bg-gradient-to-r from-primary-600 to-indigo-600`) displaying personalized welcome, remaining quota, and inline "+ Apply for Leave" pill CTA.
* **Bento Grid**:
  * **Leave Entitlements**: Dual visual progress tracks for Vacation and Sick leave with percentage pills.
  * **Active Request Lifecycle Stepper**: 4-stage visual stepper (`1. Application Submitted` ➔ `2. Manager Review` ➔ `3. HR Clearance` ➔ `4. Approved`).
* **Dedicated Right Rail**:
  * Interactive Month Calendar with absence markers.
  * Live "Team Absences" feed showing coworkers on leave with avatar initials.
  * Manager fast-action review prompt with 1-click decision trigger.

---

### 2. Interactive Leave Application Modal
* **Visual Category Cards**: Clickable cards for Vacation, Sick, Emergency, Maternity, and Paternity leaves with live remaining balance tags.
* **Interactive Visual Date-Range Picker**: Multi-day visual range selection highlighting the interval, shading weekends, and flagging public holidays.
* **Statutory Holiday Exemption**: Public holidays falling within leave requests are automatically identified and exempted from deducted vacation days.
* **Real-time Working-Days Banner**: Shows exact deducted working days alongside weekend and holiday exemptions.
* **Secure Document Upload**: Drag-and-drop file upload with binary magic-byte verification (PDF, PNG, JPG, max 5MB).

---

### 3. In-App Activity & Notification Drawer
* Glassmorphic floating drawer triggered by the header notification bell.
* Tracks approval decisions, supervisor notes, and company announcements.
* One-click "Mark all read" with real-time unread badge counter.

---

### 4. Statutory Holidays Engine (MySQL)
* Created `holidays` table in MySQL (`id`, `name`, `date`, `isRecurring`).
* Seeded 13 official public holidays for 2026.
* Displays holiday markers on the team calendar and modal date-picker.

---

### 5. 1-Click CSV Audit Export
* Added `/api/admin/export` generating RFC-compliant CSV reports with leave number, employee details, department, dates, duration, status, and supervisor comments.
* Export buttons integrated on both the main dashboard and quota management ledger.

---

### 6. Profile & Security Credentials
* Added `ChangePasswordModal` enforcing OWASP complexity rules (uppercase, lowercase, number, special character).
* Verifies current password before updating and records `PASSWORD_CHANGED` in the MySQL audit log.

---

## 🧪 Verification & Test Results

### Automated Build & Endpoint Tests
| Endpoint / Check | Method | Result | Notes |
| :--- | :---: | :---: | :--- |
| **Production Build** | `next build` | **PASSED (0 errors)** | 26 routes compiled and optimized |
| **`/api/holidays`** | `GET` | **HTTP 200** | Returns 13 official public holidays |
| **`/api/notifications`**| `GET` / `PATCH` | **HTTP 200** | Returns unread notifications & updates status |
| **`/api/admin/export`** | `GET` | **HTTP 200** | Streams CSV file attachment with complete audit data |
| **`/api/upload`** | `POST` | **HTTP 200** | Magic-byte validated file storage under `/uploads` |
| **`/api/auth/change-password`** | `POST` | **HTTP 200** | Current password verification & OWASP rules |

---

## 🚀 How to Experience the Upgrades

1. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
2. Sign in using any of the 1-click test pills (e.g. **Employee** or **Dept Manager**).
3. **Try the New Modal**: Click **Apply for Leave** in the hero banner or right rail. Notice the visual category cards, click the visual calendar picker, and observe the automatic holiday exemptions.
4. **Try Notifications**: Click the bell icon in the top header to inspect the glassmorphic activity stream.
5. **Try CSV Export**: Click the **Export CSV** pill on the dashboard or quota page to instantly download the ledger.
6. **Try Team Calendar Filters**: Visit **Team Calendar** in the floating sidebar and filter by department.
