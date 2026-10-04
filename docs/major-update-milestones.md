# Devanu-Lenvanu — Major Architecture & Business Flow Milestones

**Project**: Devanu-Lenvanu  
**Reference Specification**: [`docs/devanu-lenvanu-major-update-specification.md`](file:///d:/projects/startup/leva-devanu/docs/devanu-lenvanu-major-update-specification.md)  
**Target**: Step-by-step implementation plan for the updated business workflow and wireframe architecture.

---

## Milestone Roadmap Overview

```text
[ Milestone 1 ] Database Schema, Models & Data Migration
       ↓
[ Milestone 2 ] Design Number Master & Updated Masters Module
       ↓
[ Milestone 3 ] Workers Management & Enhanced Worker Financial Profile
       ↓
[ Milestone 4 ] Work Issue (Devanu) with Color-Wise Multi-Row Calculation
       ↓
[ Milestone 5 ] Work Return (Lenvanu) with Per-Color Reconciliation
       ↓
[ Milestone 6 ] Worker Payment & Financial Settlement Module
       ↓
[ Milestone 7 ] Multi-Dimensional Reports Suite (Hisab, Worker, Design, Payment)
       ↓
[ Milestone 8 ] Dashboard, Mobile Bottom Nav & End-to-End Polish
```

---

## Milestone 1: Database Schema & Safe Data Migration

- [x] **1.1 Prisma Schema Refactoring**:
  - Created `DesignNumberMaster` (`id`, `designNumber` unique, `isActive`, timestamps).
  - Created `WorkTransactionColor` model (`id`, `workTransactionId`, `colorId`, `colorNameSnapshot`, `heads`, `piecesPerHead`, `givenPieces`, `returnedPieces`, `damagedPieces`, `rate`, `amount`).
  - Updated `WorkTransaction` model to act as the parent container with `designNumberId`, `designNumberSnapshot`, `categoryId`, `categorySnapshot`, `cuttingStyleId`, `cuttingStyleSnapshot`, `issueDate`, `totalGivenPieces`, `totalReturnedPieces`, `totalDamagedPieces`, `totalAmount`, `workStatus` (`TransactionStatus`), `paymentStatus` (`PaymentStatus`).
  - Created `Payment` and `PaymentAllocation` models.
  - Added `enum PaymentStatus { UNPAID, PARTIALLY_PAID, PAID }`.
- [x] **1.2 Data Migration & Sync**:
  - Wiped old obsolete schema structures and synchronized with PostgreSQL via `prisma db push`.
  - Generated latest Prisma client (`v6.19.3`).
  - Seeded database with new architecture & exact wireframe demo data (`prisma/seed.ts`).

---

## Milestone 2: Design Number Master & System Masters

- [x] **2.1 Design Numbers Management (`/design-numbers`)**:
  - List View Table with search, active status badges, summary metrics, and responsive table/cards.
  - Add / Edit Design Number modal/form (`designNumber` input with uppercase transformation and validation).
  - Server Actions (`createDesignNumberAction`, `updateDesignNumberAction`, `toggleActiveDesignNumberAction`, `deleteDesignNumberAction` with safety check).
- [x] **2.2 System Masters Management (`/masters`)**:
  - Tabbed interface matching wireframe: **Colors** | **Material Categories** | **Cutting Types**.
  - Integrated color dot previews and status toggles.
  - Edit inline modal, search per tab, and delete integrity guards preventing deletion of items with historical usage.
- [x] **2.3 Sidebar & Bottom Navigation**:
  - Desktop Sidebar & Mobile Bottom Navigation updated to match wireframe.

---

## Milestone 3: Workers Management & Enhanced Financial Profiles

- [x] **3.1 Workers Directory (`/workers` / `/customers`)**:
  - Table and responsive card view with search, avatar initials, 10-digit Indian mobile validation (`/^[6-9]\d{9}$/`), area/address, active work counter, and live outstanding balances.
  - Add / Edit Worker forms and server actions with validation.
  - Dual route aliases (`/customers` & `/workers`).
- [x] **3.2 Worker Profile & Financial Ledger (`/workers/[id]`)**:
  - Top metric summary cards: Outside Pieces, Completed Pieces, Total Work Payable, Total Cash Paid, and Net Balance Due.
  - 3 Tabbed sections:
    - **Active Work**: Color-wise breakdown, pieces outside, and 1-click "Record Return (Lenvanu)" shortcut.
    - **Work History**: Complete work ledger with dates, status badges, pieces, and order values.
    - **Payment History**: Cash settlement disbursements with date ranges and allocated work orders.

---

## Milestone 4: Work Issue (Devanu) with Color-Wise Multi-Row Calculation

- [x] **4.1 Issue Work Form (`/work/new`)**:
  - **Left Column**: Worker select, Design Number select, Material Category select, Cutting Style buttons, Issue Date picker, Remarks.
  - **Right Column (Color-Wise Details)**:
    - Interactive **"+ Add Color Row"** and remove row actions.
    - Color dropdown with swatch dot from Color Master.
    - Per-color inputs for `Heads`, `Pieces/Head`, and `Rate (₹)`.
    - Live client-side reactive calculations:
      $$\text{Given Pieces} = \text{Heads} \times \text{Pieces/Head}$$
      $$\text{Amount (₹)} = \text{Given Pieces} \times \text{Rate}$$
    - Footer card showing Total Heads, Total Given Pieces, and Total Work Issue Amount.
- [x] **4.2 Atomic Server Action**:
  - `createWorkTransactionAction` using `prisma.$transaction` to create parent `WorkTransaction` and all child `WorkTransactionColor` rows atomically.

---

## Milestone 5: Work Return (Lenvanu) with Per-Color Reconciliation

- [x] **5.1 Color-Wise Return Interface (`/work/[id]/return`)**:
  - Summary header: Worker Name & Phone, Design Number, Issue Date, Category, Cutting Style, Total Given Pieces.
  - **Color-Wise Return Table**:
    - For each color row: Given Pieces, Returned Pieces (input), Damaged Pieces (input), Remaining Pieces (auto-calculated).
    - Validation: $\text{Returned} + \text{Damaged} \le \text{Given}$ enforced per color.
    - Quick "Full Return (All Pcs)" 1-click shortcut.
- [x] **5.2 Status & Reconciliation Logic**:
  - Server Action `recordColorReturnAction` calculating status:
    - $\text{If all color rows fully returned} \implies \mathbf{COMPLETED}$
    - $\text{If partial} \implies \mathbf{PARTIALLY\_RETURNED}$
- [x] **5.3 Work Order Ledger (`/work`)**:
  - Status tabs: **All Orders** | **Pending / Active** | **Completed**.
  - High-density table with date, worker, design code badge, color breakdown chips, given/returned pieces, order value, and 1-click return actions.

---

## Milestone 6: Worker Payment & Settlement Module

- [x] **6.1 Add Payment Interface (`/payments/new`)**:
  - Worker selector dropdown.
  - Date Range picker (`fromDate` to `toDate` filtering strictly on Work Issue **`issueDate`**) with quick preset shortcuts (This Month, Last Month, Last 30 Days, All Time).
  - Live preview of eligible orders in the selected period: Total Period Billing, Already Paid, and Outstanding.
  - Auto pre-filling of Payment Amount with the outstanding period balance.
- [x] **6.2 Atomic Payment Server Action**:
  - `createPaymentAction` creating `Payment` record and `PaymentAllocation` records with FIFO allocation.
  - Automatic payment status updates on affected `WorkTransaction` records (`PAID` or `PARTIALLY_PAID`).
  - `deletePaymentAction` with automatic status recalibration.
- [x] **6.3 Payment History Ledger (`/payments`)**:
  - Table showing: Payment Date, Worker Name, Period Range, Amount (₹), Allocated Orders count, Notes, Actions.
  - Interactive Payment Breakdown Modal displaying all settled work issues with design codes and allocated amounts.

---

## Milestone 7: Multi-Dimensional Reports Suite

- [x] **7.1 Centralized Reports Page (`/reports`) with Tabs**:
  - **Tab 1: Monthly Hisab**: Monthly piece and financial balances with payment status and outstanding columns.
  - **Tab 2: Worker Report**: Grouped by worker with Total Orders, Given, Returned, Damaged, Payable, Paid, Outstanding.
  - **Tab 3: Design Report**: Grouped by Design Number with volume, batches, and financial totals.
  - **Tab 4: Payment Report**: Summary of all cash disbursements by date range and worker.
- [x] **7.2 Export Features**:
  - Clean Print stylesheet (`window.print()`).
  - Export to CSV / Excel for each active report.

---

## Milestone 8: Dashboard, Mobile UI Polish & End-to-End Verification

- [x] **8.1 Dashboard (`/`) Updates**:
  - Top 4 Metric KPI Cards: Total Workers, Today Issue, Pending Pieces Outside, Outstanding Payment.
  - Recent Work Issue table with live status badges.
  - Payment Overview card for current month (Total Payable, Paid, Remaining).
- [x] **8.2 Mobile-First Navigation & Polish**:
  - Persistent bottom navigation bar (`Home`, `Work`, `Payment`, `Reports`).
  - Card-based vertical layouts for Work Issue and Returns on mobile screens.
- [x] **8.3 Build Verification & Seed Test**:
  - Verify complete application with `next build` (0 TypeScript / Turbopack errors).
  - Seed fresh sample data matching the wireframe demo.

