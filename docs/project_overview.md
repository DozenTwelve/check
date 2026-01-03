# CheckingAll Ledger MVP - Project Documentation

## 1. Executive Summary
**CheckingAll Ledger** is a specialized logistics and asset tracking system designed for managing the flow of returnable consumables (e.g., boxes, totes) between a central cleaning platform, multiple branch factories, and client sites.

The system replaces manual "check-in/check-out" processes with a digital ledger that enforces:
-   **Role-Based Access Control (RBAC)**: Strict separation of duties between Drivers, Clerks, Managers, and Admins.
-   **Site Hierarchy**: A flexible M:N relationship where Factories serve Sites, and Managers oversee those Sites.
-   **Daily Accountability**: Workflows for Daily Outbounds (Clerk) and Return Trips (Driver) with mandatory reconciliation (Manager).

---

## 2. Technology Stack

### Frontend (Client)
-   **Framework**: [React](https://react.dev/) (v18+)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: Custom CSS (Vanilla, located in `styles.css`) - No heavyweight UI libraries; focused on performance and specific aesthetic requirements.
-   **Routing**: Single Page Application (SPA) structure managed via conditional rendering in `App.jsx`.
-   **State Management**: React Hooks (`useState`, `useEffect`, `useContext`).
-   **Internationalization**: Custom Hook (`useTranslation`) supporting English (`en`) and Chinese (`zh`).

### Backend (Server)
-   **Runtime**: [Node.js](https://nodejs.org/)
-   **Framework**: [Express.js](https://expressjs.com/)
-   **Database Interface**: [node-postgres (pg)](https://node-postgres.com/) for direct, high-performance SQL execution.
-   **Authentication**: JWT-based login with bearer tokens; Bcrypt for password hashing.

### Database
-   **RDBMS**: PostgreSQL
-   **Schema Management**: Raw SQL migration scripts located in `server/db/`.
-   **Key Features Used**: Enums, Foreign Keys with Cascade/Restrict constraints, Transactions.

---

## 3. Project Structure & File Guide

### Root Directory
-   `cleanup_roles.js`: Utility script to sanitize database role assignments.
-   `check_assignments.js`: Utility script to verify data integrity.

### `/client` (Frontend)
Located in `client/src/`:

| File / Folder | Purpose |
| :--- | :--- |
| **`App.jsx`** | Main entry point. Handles "Routing" (switching views based on User Role) and core layout. |
| **`styles.css`** | Global stylesheet containing all design tokens, component styles, and responsive rules. |
| **`hooks/`** | Custom React hooks for logic encapsulation: |
| &nbsp;&nbsp;`useAuth.js` | Manages user login state, loading user profile, and specific permissions. |
| &nbsp;&nbsp;`useMasterData.js` | Fetches and caches Factories and Consumables lists. |
| &nbsp;&nbsp;`useDailyReturns.js` | Manages value-stream data for the "Adjustments" view. |
| **`components/`** | Reusable UI blocks and Feature Panels: |
| &nbsp;&nbsp;`AdminPanel.jsx` | **Secure**. Full CRUD for Users, Factories, Sites, Consumables. Includes bi-directional linking. |
| &nbsp;&nbsp;`ManagerDashboard.jsx` | **Hub**. Where Managers review "Pending" trips and "Daily Outbound" forms. |
| &nbsp;&nbsp;`TripEntryForm.jsx` | **Driver Workflow**. Interface for logging returning trucks/assets. |
| &nbsp;&nbsp;`DailyOutboundForm.jsx` | **Clerk Workflow**. Interface for logging daily shipments to sites. |
| &nbsp;&nbsp;`Reports.jsx` | Read-only view for generating balance reports. |

### `/server` (Backend)
Located in `server/src/`:

| File / Folder | Purpose |
| :--- | :--- |
| **`index.js`** | Server entry point.Configures CORS, JSON parsing, and mounts routes. |
| **`routes/`** | API Route Definitions: |
| &nbsp;&nbsp;`masterData.js` | Endpoints for Factories (`/factories`), Sites (`/client-sites`), and Consumables. |
| &nbsp;&nbsp;`users.js` | Endpoints for User management (`/users`). |
| &nbsp;&nbsp;`trips.js` | Endpoints for Driver workflow (`/trips`). |
| &nbsp;&nbsp;`dailyOutbound.js` | Endpoints for Clerk workflow (`/daily-outbound`). |
| **`controllers/`** | Business Logic: |
| &nbsp;&nbsp;`masterDataController.js` | Handles CRUD for entities. Contains complex logic for `site_factories` M:N updates. |
| &nbsp;&nbsp;`managerController.js` | Aggregates data for the Manager Dashboard (Pending Items). |
| &nbsp;&nbsp;`userController.js` | User creation/updates. **Enforces logic**: Managers cannot have Factories; Drivers cannot have Sites. |
| **`db/`** | Database Scripts: |
| &nbsp;&nbsp;`1_init.sql` | Schema initialization (users, factories, types). |
| &nbsp;&nbsp;`5_site_mn_hierarchy.sql` | Migration script that introduced the M:N Site-Factory relationship. |
| &nbsp;&nbsp;`run_migration.js` | Node script to apply SQL migrations sequentially. |

---

## 4. Database Schema & Relationships

The database is normalized to ensure data integrity.

### Core Entities

1.  **Users (`users`)**
    *   **Role (`user_role`)**: Enum (`driver`, `clerk`, `manager`, `admin`).
    *   **Context**:
        *   `factory_id`: FK to `factories`. **Required** for Drivers/Clerks. **MUST BE NULL** for Managers/Admins.
        *   `site_id`: FK to `client_sites`. **Required** for Managers. **MUST BE NULL** for Drivers/Clerks.
    *   *Constraint*: A DB constraint (`role_factory_check`) enforces some of these rules, complemented by Application Logic.

2.  **Factories (`factories`)**
    *   Represents a logistical node (e.g., a washing plant).
    *   Has many **Staff** (Drivers/Clerks).

3.  **Client Sites (`client_sites`)**
    *   Represents a customer location (e.g., "Hospital A", "Hotel B").
    *   Has many **Managers**.

4.  **Consumables (`consumables`)**
    *   Master list of trackable items (e.g., "Large Tote", "Small Box").

### Relationships

*   **Factory <-> Site (M:N)**
    *   **Table**: `site_factories` (`site_id`, `factory_id`)
    *   **Logic**: A Factory can serve multiple Sites. A Site can be served by multiple Factories.
    *   **Management**: customizable via the Admin Panel (from either the Factory or Site edit screen).

*   **Transactions**
    *   **Return Trips (`return_trips`)**: Linked to `factory_id`, `driver_id` (User), and `site_id`. Represents items coming *back* to the factory.
    *   **Daily Outbound (`daily_outbound`)**: Linked to `factory_id`, `site_id`, `recorded_by` (Clerk User). Represents items going *out* to a site.
    *   **Confirms (`daily_returns` / `confirmations`)**: Managers "Confirm" these events, effectively locking them.

---

## 5. Security Model

*   **Authentication**: Currently ID-based headers for MVP speed, but password infrastructure (`password_hash`) is in place for full auth upgrade.
*   **Authorization**: Middleware (`requireRole`) protects sensitive routes.
    *   `Admin`: Full Access.
    *   `Manager`: Read-Only Master Data, Write Access to Confirmations/Reports.
    *   `Driver/Clerk`: Write Access only to their specific daily forms.

## 6. Development Workflow

1.  **Frontend**: Run `npm run dev` in `client/`.
2.  **Backend**: Run `npm start` in `server/`.
3.  **Migrations**: Place `.sql` files in `server/db/` and run `node db/run_migration.js`.

---

*This documentation was generated on Jan 3, 2026.*
