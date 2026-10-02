# Devanu-Lenvanu — Work & Piece Record Management System

## 1. Project Overview

**Devanu-Lenvanu** is a small internal web application for replacing the physical record books currently used to track pieces/material given to customers or workers for cutting/work and the pieces returned later.

The application is intentionally simple:

- No authentication/login is required.
- It is intended for one internal operator/handler.
- The main purpose is accurate record keeping.
- It must track customers, designs, colors, work transactions, quantities, returns, damaged/garbage pieces, rates, dates, and monthly earnings/payable reports.
- Historical records must never be lost when a transaction is completed.

The system should be designed around the actual physical-book workflow rather than as a generic inventory system.

---

# 2. Business Terminology

The exact Gujarati business terminology can be adjusted later, but the initial system should support the following concepts.

## 2.1 Material Types

There are two main material/piece categories:

1. **Bhagvan na assen na net**
2. **Watwat**

Use a database enum such as:

```text
BHAGVAN_ASSEN_NET
WATWAT
```

The UI can display the proper Gujarati/local names.

---

## 2.2 Work Types

There are two types of work/cutting:

1. **Katar Cutting**
2. **Reniya Cutting**

Use:

```text
KATAR_CUTTING
RENIYA_CUTTING
```

Do not create separate database systems for these two work types. They should be represented by one `workType` field in the transaction.

---

# 3. Main Objective

The application must answer these questions easily:

### Customer questions

- Which customers/workers exist?
- What work is currently with a particular customer?
- What work has this customer completed?
- How many pieces were given?
- How many were returned?
- How many were damaged/garbage?
- How much money is payable for a particular period?

### Design questions

- What designs exist?
- What colors are available for a design?
- How many heads/pieces does a design represent?
- What is the default rate?
- What was the design used for historically?

### Transaction questions

- Who received the work?
- Which design?
- Which material?
- Which color?
- Which work type?
- How many heads?
- How many pieces?
- What rate was applied?
- When was it given?
- When was it returned?
- How many pieces were returned?
- How many pieces were damaged/garbage?
- How much money is associated with the transaction?

### Monthly report questions

- Which customers worked during a month?
- How much work did each customer complete?
- How many pieces were completed?
- What rate was applied?
- What total amount is payable/earned for each customer?
- What was damaged/garbage?
- Which transactions are still pending?

---

# 4. Recommended Technology Stack

## Frontend + Backend

### Next.js + TypeScript

Use a single Next.js repository for both frontend and backend.

Recommended:

```text
Next.js
TypeScript
App Router
```

There is no need for a separate Express backend for this project.

Next.js will contain:

- UI/pages
- Server Components where useful
- Server Actions and/or Route Handlers for mutations/API functionality
- Business logic
- Database access through Prisma

---

## UI

### Tailwind CSS

Use Tailwind CSS for styling.

### shadcn/ui

Use shadcn/ui for:

- Dialogs
- Buttons
- Inputs
- Selects
- Tables
- Cards
- Dropdowns
- Date pickers
- Tabs
- Alerts
- Confirmation dialogs

The application should look like a clean small business/admin dashboard.

---

## Database

### PostgreSQL

PostgreSQL is recommended because the application contains strongly related data:

```text
Customer
   ↓
Work Transaction
   ↓
Design
   ↓
Color
   ↓
Quantity / Return / Damage
   ↓
Monthly Report
```

A relational database is a good fit for these relationships and calculations.

---

## ORM

### Prisma

Use Prisma ORM for:

- Database schema
- Migrations
- Type-safe queries
- Relationships
- Transactions
- CRUD operations

---

## Validation

### Zod

Use Zod for validating:

- Customer forms
- Design forms
- Color inputs
- Transaction inputs
- Return inputs
- Rate values
- Quantity values
- Dates

---

## Forms

### React Hook Form

Use React Hook Form with Zod for:

- Add customer
- Edit customer
- Add design
- Edit design
- Create work transaction
- Return work
- Add/update damaged quantity

---

## Deployment

Recommended production architecture:

```text
GitHub
   ↓
Vercel
   ↓
Next.js application
   ↓
Prisma
   ↓
PostgreSQL database
```

The PostgreSQL database must be hosted separately from Vercel.

Possible PostgreSQL providers:

- Neon
- Supabase
- Railway
- Other managed PostgreSQL providers

For a small project, use a managed PostgreSQL provider with a free/low-cost tier where appropriate.

---

# 5. Project Architecture

Recommended high-level architecture:

```text
User
  │
  ▼
Next.js Web Application
  │
  ├── UI / Pages
  ├── Forms
  ├── Validation
  ├── Business Logic
  └── Server Actions / Route Handlers
          │
          ▼
       Prisma ORM
          │
          ▼
      PostgreSQL
```

There should be **one GitHub repository** containing the Next.js application.

---

# 6. Core Modules

The application should initially contain these modules:

1. Dashboard / Home
2. Customers
3. Designs
4. Work Transactions
5. Return Processing
6. Damaged/Garbage Records
7. Monthly Reports
8. Basic settings/reference data if required later

---

# 7. Dashboard / Home Page

The home page should immediately show the most useful information.

## Summary cards

Display:

- Total Customers
- Total Designs
- Currently Active/Pending Work
- Total Pieces Currently Outside
- Total Damaged/Garbage Pieces
- Current Month Total Amount

## Recent activity

Show recent transactions:

```text
Customer
Design
Work Type
Material
Color
Given Quantity
Status
Start Date
```

## Pending work

Show transactions that have not been returned.

Example:

```text
Customer A
Design 01
230 heads
12 pieces/head
2,760 pieces
Started: 02-10-2026
Status: Pending
```

---

# 8. Customer Management

## Customer fields

A customer should contain:

```text
id
name
phoneNumber
address
createdAt
updatedAt
```

Optional future fields:

```text
notes
isActive
```

## Customer CRUD

The operator should be able to:

- Create customer
- View customer
- Edit customer
- Delete/archive customer
- Search customer
- View customer transaction history

## Customer list

Recommended columns:

| Column | Description |
|---|---|
| Name | Customer name |
| Phone | Phone number |
| Address | Address |
| Active Work | Number of pending transactions |
| Total Work | Historical transaction count |
| Actions | View/Edit/Delete |

---

# 9. Design Management

A design is a reusable definition of the design/work pattern.

## Design fields

```text
id
designNumber
materialType
headQuantity
piecesPerHead
defaultRate
createdAt
updatedAt
```

Example:

```text
Design Number: DESIGN-01
Material: Bhagvan na assen na net
Heads: 30
Pieces per Head: 12
Default Rate: ₹X
```

Total pieces:

```text
30 × 12 = 360 pieces
```

---

# 10. Design Colors

One design can have multiple colors.

Example:

```text
Design-01
 ├── Black
 ├── Red
 ├── Green
 └── Blue
```

Do not store multiple colors as one comma-separated database string.

Use a proper relational model.

Possible structure:

```text
Design
  ↓
DesignColor
  ↓
Color
```

A simpler implementation may use:

```text
Design
  ↓
DesignColor
```

with the color name stored on `DesignColor`.

The important requirement is that one design supports multiple colors.

---

# 11. Default Rate

Every design has a default rate.

Example:

```text
Design-01
Default Rate = ₹0.50
```

When creating a new transaction:

```text
Customer A
Design-01
```

the system should automatically load:

```text
Default Rate = ₹0.50
```

However, the operator must be able to override the rate for that specific transaction.

Example:

```text
Design default rate: ₹0.50
Customer-specific transaction rate: ₹0.55
```

The transaction should store the actual rate used.

This is important because historical transactions must not change if the design's default rate is changed later.

---

# 12. Work Transaction

This is the most important entity in the system.

A work transaction represents material/work given to a customer.

## Example

```text
Customer:
Raj

Material:
Bhagvan na assen na net

Work Type:
Katar Cutting

Design:
Design-01

Color:
Black

Heads:
230

Pieces Per Head:
12

Total Pieces:
2760

Rate:
₹X

Start Date:
02-10-2026
```

---

# 13. Transaction Fields

Recommended fields:

```text
id
customerId
designId
colorId
materialType
workType
headQuantity
piecesPerHead
givenPieces
rate
startDate
returnDate
returnedPieces
damagedPieces
status
notes
createdAt
updatedAt
```

## Important principle

Store the transaction's actual quantities and rate.

Do not rely only on the current Design values.

For example, if Design-01 originally had:

```text
12 pieces/head
```

and later changes to:

```text
10 pieces/head
```

old transactions must still show:

```text
12 pieces/head
```

Therefore, transaction-level values should be stored.

---

# 14. Quantity Calculation

If the operator enters:

```text
Heads = 230
Pieces per Head = 12
```

calculate:

```text
Given Pieces = 230 × 12
              = 2760
```

The system should automatically calculate this.

The operator should normally not need to manually calculate total pieces.

---

# 15. Starting a Work Transaction

Flow:

```text
Click "New Work"
       ↓
Select Customer
       ↓
Select Design
       ↓
Select Color
       ↓
Select Material
       ↓
Select Work Type
       ↓
Enter Heads
       ↓
Pieces/Head loaded from Design
       ↓
Calculate Total Pieces
       ↓
Default Rate loaded
       ↓
Allow rate override
       ↓
Select Start Date
       ↓
Save
```

After saving:

```text
Status = PENDING
```

---

# 16. Return Process

When the customer returns the completed work, the operator should open the pending transaction.

Example:

```text
Given Pieces: 12000
```

Operator enters:

```text
Returned Pieces: 11990
```

The system calculates:

```text
Difference = 12000 - 11990
           = 10
```

If those 10 pieces are unusable:

```text
Damaged/Garbage = 10
```

The transaction can then be marked:

```text
COMPLETED
```

---

# 17. Damaged/Garbage Handling

This must be a separate, clearly visible quantity.

Example:

```text
Given:       12000
Returned:    11990
Damaged:        10
-------------------
Accounted:    12000
```

Validation:

```text
returnedPieces + damagedPieces <= givenPieces
```

The application must never allow:

```text
Returned + Damaged > Given
```

Example:

```text
Given = 1000
Returned = 950
Damaged = 60
```

This must be rejected because:

```text
950 + 60 = 1010 > 1000
```

---

# 18. Return Status

Recommended statuses:

```text
PENDING
PARTIALLY_RETURNED
COMPLETED
CANCELLED
```

### PENDING

No return has been recorded.

### PARTIALLY_RETURNED

Some quantity has been returned, but the transaction is not fully accounted for.

### COMPLETED

All given pieces have been accounted for:

```text
returnedPieces + damagedPieces = givenPieces
```

### CANCELLED

Transaction was cancelled according to business rules.

Do not physically delete completed historical transactions unless there is a very specific administrative requirement.

---

# 19. Important Business Rule

The system must distinguish between:

### Returned pieces

Pieces that came back usable.

### Damaged/Garbage pieces

Pieces that did not come back as usable pieces.

### Remaining/unaccounted pieces

Pieces that are still neither returned nor marked damaged.

Formula:

```text
remainingPieces =
givenPieces - returnedPieces - damagedPieces
```

Example:

```text
Given = 12000
Returned = 11900
Damaged = 50

Remaining = 12000 - 11900 - 50
          = 50
```

The transaction remains incomplete until the remaining quantity is accounted for.

---

# 20. Rate and Amount Calculation

The exact unit for the rate should be confirmed from the real business process before final implementation.

The system should support the intended calculation without hard-coding assumptions.

Possible model:

```text
amount = completedPieces × rate
```

or, if the business rate is based on heads:

```text
amount = completedHeads × rate
```

The final implementation should use whichever unit the real physical books currently use.

## Recommended approach

Store:

```text
rate
rateUnit
```

where:

```text
rateUnit = PER_PIECE | PER_HEAD
```

Then calculate accordingly.

This makes the application flexible.

---

# 21. Customer-Specific Rate

Rates can differ between customers.

Example:

```text
Design default:
₹0.50/piece
```

Customer A:

```text
₹0.50/piece
```

Customer B:

```text
₹0.55/piece
```

Customer C:

```text
₹0.48/piece
```

The Design's default rate should be used as the initial value, but the transaction's actual rate should be independently stored.

Changing the Design default rate later must not modify existing transactions.

---

# 22. Monthly Report

At the end of every month, the operator should be able to select:

```text
Month
Year
```

Example:

```text
October 2026
```

The system should show customer-wise results.

## Example

| Customer | Transactions | Completed Pieces | Damaged | Amount |
|---|---:|---:|---:|---:|
| Raj | 5 | 12,000 | 10 | ₹X |
| Amit | 3 | 8,500 | 20 | ₹Y |
| Jay | 7 | 15,200 | 5 | ₹Z |

At the bottom:

```text
Total Completed Pieces
Total Damaged Pieces
Total Amount
```

---

# 23. Monthly Report Date Rule

The report must clearly define which transactions belong to a month.

Recommended rule:

**Include work based on the completion/return date for payable work.**

For example:

```text
Started: 28 Sep
Returned: 03 Oct
```

This should be included in the **October completed-work report**, if payment is based on completed/returned work.

However, this rule should be confirmed against the real business practice before production use.

---

# 24. Customer History

Opening a customer should show:

```text
Customer Information
       ↓
Current/Pending Work
       ↓
Completed Work
       ↓
Historical Transactions
       ↓
Total Amount
```

Example:

```text
Raj

Pending:
- Design-02 / Black / 500 pieces

Completed:
- Design-01 / Red / 2000 pieces
- Design-03 / Black / 3500 pieces

Total historical amount:
₹XXXX
```

---

# 25. Design History

Opening a design should show:

```text
Design information
Colors
Default rate
Historical transactions
Customers who received it
Total pieces
Returned pieces
Damaged pieces
```

---

# 26. Search and Filtering

The application should support useful filters.

## Customer filters

- Search by name
- Search by phone

## Transaction filters

- Customer
- Design
- Color
- Material
- Work type
- Status
- Start date
- Return date

## Monthly report filters

- Month
- Year
- Customer
- Work type
- Material

---

# 27. Recommended Pages

Use this initial route structure:

```text
/
```

Dashboard/Home.

```text
/customers
/customers/new
/customers/[id]
/customers/[id]/edit
```

Customer management.

```text
/designs
/designs/new
/designs/[id]
/designs/[id]/edit
```

Design management.

```text
/work
/work/new
/work/[id]
/work/[id]/return
```

Work/transaction management.

```text
/reports/monthly
```

Monthly report.

Optional:

```text
/settings
```

Only if future reference-data management is required.

---

# 28. Recommended Database Models

Initial Prisma models should be approximately:

```text
Customer
Design
DesignColor
WorkTransaction
```

Optional:

```text
Color
```

depending on whether colors need to be globally managed.

---

# 29. Suggested Prisma Data Model

The following is a conceptual model. Adjust field names/types during implementation.

```prisma
enum MaterialType {
  BHAGVAN_ASSEN_NET
  WATWAT
}

enum WorkType {
  KATAR_CUTTING
  RENIYA_CUTTING
}

enum TransactionStatus {
  PENDING
  PARTIALLY_RETURNED
  COMPLETED
  CANCELLED
}

enum RateUnit {
  PER_PIECE
  PER_HEAD
}

model Customer {
  id           String            @id @default(cuid())
  name         String
  phoneNumber  String?
  address      String?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  transactions WorkTransaction[]
}

model Design {
  id             String            @id @default(cuid())
  designNumber   String            @unique
  materialType   MaterialType
  headQuantity   Int?
  piecesPerHead  Int
  defaultRate    Decimal
  rateUnit       RateUnit          @default(PER_PIECE)
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  colors         DesignColor[]
  transactions   WorkTransaction[]
}

model DesignColor {
  id            String            @id @default(cuid())
  designId      String
  colorName     String
  createdAt     DateTime          @default(now())

  design        Design            @relation(fields: [designId], references: [id], onDelete: Cascade)
  transactions  WorkTransaction[]

  @@unique([designId, colorName])
}

model WorkTransaction {
  id               String             @id @default(cuid())
  customerId       String
  designId         String
  colorId          String?

  materialType     MaterialType
  workType         WorkType

  headQuantity     Int
  piecesPerHead    Int
  givenPieces      Int

  returnedPieces   Int                @default(0)
  damagedPieces    Int                @default(0)

  rate             Decimal
  rateUnit         RateUnit

  startDate        DateTime
  returnDate       DateTime?

  status           TransactionStatus   @default(PENDING)

  notes            String?

  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt

  customer         Customer           @relation(fields: [customerId], references: [id])
  design           Design             @relation(fields: [designId], references: [id])
  color            DesignColor?       @relation(fields: [colorId], references: [id])

  @@index([customerId])
  @@index([designId])
  @@index([status])
  @@index([startDate])
  @@index([returnDate])
}
```

This schema is a starting point, not a requirement to copy blindly.

---

# 30. Database Integrity Rules

The application must validate:

```text
headQuantity > 0
piecesPerHead > 0
givenPieces > 0
rate >= 0
returnedPieces >= 0
damagedPieces >= 0
```

And:

```text
returnedPieces + damagedPieces <= givenPieces
```

For completed transactions:

```text
returnedPieces + damagedPieces = givenPieces
```

The same rules should be enforced at the application/business-logic level, not only in the UI.

---

# 31. CRUD Requirements

## Customer

Required:

- Create
- Read/list
- Read/details
- Update
- Delete/archive

## Design

Required:

- Create
- Read/list
- Read/details
- Update
- Delete/archive

## Design Colors

Required:

- Add
- Remove
- List

## Work Transactions

Required:

- Create
- Read
- Update where safe
- Return
- Complete
- Cancel where allowed

Avoid deleting historical transactions because reports depend on historical data.

---

# 32. Soft Delete Recommendation

For Customers and Designs, prefer:

```text
isActive
```

instead of hard deleting records that already have transaction history.

Example:

```text
Customer A
isActive = false
```

The customer disappears from new transaction selection but historical transactions remain available.

Same principle for Designs.

---

# 33. Transaction Editing Rules

Before completion:

- Customer can be corrected
- Design can be corrected
- Color can be corrected
- Quantity can be corrected
- Rate can be corrected
- Start date can be corrected

After completion:

Historical financial/quantity information should be protected.

If a correction is necessary, prefer a controlled edit mechanism rather than silently changing historical data.

---

# 34. UI Design

The UI should be optimized for a person who is replacing a physical notebook.

Keep it:

- Simple
- Fast
- Large enough for easy data entry
- Mobile/tablet friendly
- Desktop friendly
- Minimal
- Easy to understand in Gujarati/local terminology if required

Avoid unnecessary enterprise features.

---

# 35. Suggested Navigation

```text
Dashboard
Customers
Designs
Work
Reports
```

Optional:

```text
Settings
```

---

# 36. Work List UI

The Work page should have tabs/filters:

```text
All
Pending
Partially Returned
Completed
Cancelled
```

Table:

| Customer | Design | Color | Work Type | Given | Returned | Damaged | Status | Start Date | Action |
|---|---|---|---|---:|---:|---:|---|---|---|

The operator should be able to quickly identify pending work.

---

# 37. New Work Form

Recommended form order:

### Step 1 — Customer

Search/select customer.

### Step 2 — Design

Search/select design.

### Step 3 — Color

Only show colors associated with that design.

### Step 4 — Material

Load from design by default but allow correction if business rules permit.

### Step 5 — Work Type

```text
Katar Cutting
Reniya Cutting
```

### Step 6 — Quantity

```text
Heads
Pieces per Head
Total Pieces
```

### Step 7 — Rate

Load design default rate.

Allow manual override.

### Step 8 — Start Date

Default to today's date.

### Step 9 — Notes

Optional.

### Step 10 — Save

Create transaction.

---

# 38. Return Form

When selecting a pending transaction:

Show:

```text
Customer
Design
Color
Material
Work Type
Given Heads
Pieces per Head
Given Pieces
Rate
Start Date
```

Then input:

```text
Returned Pieces
Damaged/Garbage Pieces
Return Date
Notes
```

Show live calculation:

```text
Given Pieces:       12000
Returned Pieces:    11990
Damaged:               10
Remaining:              0
```

If remaining is `0`, show:

```text
Ready to Complete
```

---

# 39. Preventing Incorrect Data

Before saving return data:

```text
returnedPieces >= 0
damagedPieces >= 0
returnedPieces + damagedPieces <= givenPieces
```

If:

```text
returnedPieces + damagedPieces < givenPieces
```

then the transaction should remain:

```text
PARTIALLY_RETURNED
```

If:

```text
returnedPieces + damagedPieces = givenPieces
```

then:

```text
COMPLETED
```

---

# 40. Monthly Report Calculation

The report should calculate from actual completed transaction records.

Do not store a separate manually maintained monthly total.

Example:

```text
October 2026
```

Query completed transactions whose completion/return date falls within October.

Then group by customer.

Pseudo logic:

```text
completedTransactions
        ↓
filter by returnDate
        ↓
group by customer
        ↓
calculate completed quantity
        ↓
calculate damaged quantity
        ↓
calculate amount
        ↓
display report
```

---

# 41. Amount Calculation

If rate is per piece:

```text
amount = returnedPieces × rate
```

If damaged pieces are also payable according to business rules, this must be configurable/confirmed.

If rate is per head:

```text
completedHeads × rate
```

Do not assume that damaged pieces are automatically paid or unpaid.

The exact business rule must be confirmed before implementing final payment calculations.

---

# 42. Example End-to-End Scenario

## Step 1 — Add Design

```text
Design Number: DESIGN-01
Material: Bhagvan na assen na net
Default Rate: ₹0.50
Pieces per Head: 12

Colors:
- Black
- Red
- Green
```

---

## Step 2 — Add Customer

```text
Name: Raj
Phone: 9876543210
Address: Surat
```

---

## Step 3 — Give Work

```text
Customer: Raj
Design: DESIGN-01
Color: Black
Material: Bhagvan na assen na net
Work Type: Katar Cutting

Heads: 230
Pieces per Head: 12

Total:
230 × 12 = 2760 pieces

Rate:
₹0.50

Start Date:
02-10-2026
```

System creates:

```text
Status: PENDING
```

---

## Step 4 — Customer Returns

On:

```text
05-10-2026
```

Customer returns:

```text
Returned = 2750
Damaged = 10
```

System calculates:

```text
2750 + 10 = 2760
```

Therefore:

```text
Remaining = 0
Status = COMPLETED
```

---

# 43. Monthly Example

Suppose during October:

```text
Raj:
Transaction 1 = ₹1,000
Transaction 2 = ₹1,500
Transaction 3 = ₹800

Total = ₹3,300
```

Report:

```text
October 2026

Raj
Completed Transactions: 3
Total Amount: ₹3,300
```

The same should be calculated for every customer.

---

# 44. Dashboard Metrics

The dashboard can show:

```text
Customers
Designs
Pending Work
Completed This Month
Pieces Currently Outside
Damaged This Month
Amount This Month
```

Avoid adding too many charts.

A simple table is more useful for this application.

---

# 45. Error Handling

The application should provide clear messages.

Examples:

```text
Customer name is required.

Phone number is invalid.

Design number already exists.

At least one color is required.

Heads must be greater than 0.

Pieces per head must be greater than 0.

Returned pieces cannot exceed given pieces.

Returned + damaged pieces cannot exceed given pieces.

Cannot delete a design that has historical transactions.
```

---

# 46. Confirmation Dialogs

For destructive actions:

```text
Are you sure you want to delete this customer?
```

For completing a return:

```text
Are you sure you want to complete this transaction?
```

The UI should make it clear that historical records should not accidentally be removed.

---

# 47. No Authentication Requirement

Version 1 should NOT implement:

- Login
- Signup
- Password
- Roles
- Permissions
- OAuth

The application is intentionally an internal single-user/simple-operator system.

Authentication can be added in a future version if the application becomes public or multiple people need access.

---

# 48. No Need for a Separate Express Backend

Do not create:

```text
frontend/
backend/
```

for Version 1.

Use:

```text
devanu-lenvanu/
    app/
    components/
    lib/
    prisma/
    public/
    types/
    ...
```

Next.js can handle both frontend and backend functionality.

---

# 49. Recommended Folder Structure

```text
devanu-lenvanu/
│
├── app/
│   ├── page.tsx
│   │
│   ├── customers/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── edit/
│   │           └── page.tsx
│   │
│   ├── designs/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── edit/
│   │           └── page.tsx
│   │
│   ├── work/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── return/
│   │           └── page.tsx
│   │
│   └── reports/
│       └── monthly/
│           └── page.tsx
│
├── components/
│   ├── ui/
│   ├── customers/
│   ├── designs/
│   ├── work/
│   ├── reports/
│   └── dashboard/
│
├── lib/
│   ├── prisma.ts
│   ├── validations/
│   ├── calculations/
│   └── utils.ts
│
├── prisma/
│   └── schema.prisma
│
├── types/
│
├── public/
│
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

# 50. Important Calculation Utilities

Business calculations should be kept separate from UI components.

For example:

```text
lib/calculations/quantity.ts
lib/calculations/amount.ts
lib/calculations/transaction-status.ts
```

Functions could include:

```text
calculateGivenPieces()
calculateRemainingPieces()
calculateAmount()
calculateTransactionStatus()
```

This makes the business logic easier to test.

---

# 51. Environment Variables

Local development:

```env
DATABASE_URL="postgresql://..."
```

Production should use the PostgreSQL provider's connection string.

Never commit:

```text
.env
```

to GitHub.

Commit:

```text
.env.example
```

instead.

---

# 52. Prisma Workflow

Initial setup:

```bash
npm install prisma @prisma/client
npx prisma init
```

After schema changes:

```bash
npx prisma migrate dev --name init
```

Generate client:

```bash
npx prisma generate
```

Production deployment should use appropriate Prisma migration deployment commands rather than development reset commands.

Never casually run:

```bash
prisma migrate reset
```

against production.

---

# 53. Development Sequence

Build the project in this order.

## Phase 1 — Project Setup

- Create Next.js project
- Configure TypeScript
- Configure Tailwind
- Configure shadcn/ui
- Configure Prisma
- Connect PostgreSQL
- Create initial schema

## Phase 2 — Customer

- Customer model
- Customer list
- Add customer
- Edit customer
- Customer details
- Search
- Archive/delete behavior

## Phase 3 — Design

- Design model
- Design CRUD
- Multiple colors
- Default rate
- Design details

## Phase 4 — Work Transactions

- New transaction
- Customer selection
- Design selection
- Color selection
- Work type
- Material type
- Quantity calculation
- Default rate
- Rate override
- Start date

## Phase 5 — Return

- Pending transaction list
- Return form
- Returned quantity
- Damaged quantity
- Remaining quantity
- Return date
- Status calculation

## Phase 6 — Reports

- Monthly report
- Customer grouping
- Quantity totals
- Damage totals
- Amount totals
- Filters

## Phase 7 — Dashboard

- Summary cards
- Pending work
- Recent activity
- Current month summary

## Phase 8 — Testing & Deployment

- Validation testing
- Calculation testing
- Database testing
- Responsive UI testing
- Production PostgreSQL
- Vercel deployment

---

# 54. Testing Requirements

At minimum, test these cases.

## Quantity

```text
230 heads × 12 pieces = 2760
```

## Full return

```text
Given = 1000
Returned = 1000
Damaged = 0
Status = COMPLETED
```

## Return + damage

```text
Given = 1000
Returned = 990
Damaged = 10
Status = COMPLETED
```

## Partial return

```text
Given = 1000
Returned = 900
Damaged = 0
Status = PARTIALLY_RETURNED
```

## Invalid return

```text
Given = 1000
Returned = 950
Damaged = 100

Total = 1050
```

Must be rejected.

## Rate override

Design:

```text
Default = ₹0.50
```

Transaction:

```text
Actual = ₹0.55
```

Historical transaction must retain:

```text
₹0.55
```

even if Design default later becomes:

```text
₹0.60
```

---

# 55. Important Data Integrity Principle

Never calculate historical reports using today's Design rate.

Always use the rate saved on the transaction.

Bad:

```text
Transaction → Design → Current defaultRate
```

Correct:

```text
Transaction → Stored transaction rate
```

This is one of the most important rules in the application.

---

# 56. Future Features — NOT Version 1

Do not over-engineer Version 1.

Possible future features:

- Authentication
- Multiple operators
- User roles
- WhatsApp notifications
- SMS
- PDF reports
- Excel export
- Printable monthly report
- Customer statement
- Payment tracking
- Expense tracking
- Advanced inventory
- Audit logs
- Backup/restore
- Gujarati language toggle
- Mobile application
- Barcode/QR code
- Cloud backup

These should only be added after the basic workflow is stable.

---

# 57. Version 1 Scope

The first production version should contain exactly:

### Customers

- Add
- List
- Edit
- View history
- Archive

### Designs

- Add
- List
- Edit
- View
- Multiple colors
- Default rate
- Archive

### Work

- Create work
- Customer
- Design
- Color
- Material
- Work type
- Heads
- Pieces per head
- Total pieces
- Rate
- Start date

### Return

- Returned pieces
- Damaged/garbage pieces
- Remaining pieces
- Return date
- Status

### Reports

- Monthly report
- Customer-wise amount
- Customer-wise quantity
- Damaged quantity
- Pending work

### Dashboard

- Customers
- Designs
- Pending work
- Current month summary
- Recent transactions

---

# 58. Things That Must Be Confirmed Before Final Business Implementation

There are a few business rules that should be confirmed with the actual person using the physical books.

## 1. Rate unit

Is the rate:

```text
per piece
```

or:

```text
per head
```

or another unit?

## 2. Payment for damaged pieces

If 10 pieces are damaged, are those 10 pieces:

- still payable?
- not payable?
- partially payable?

## 3. Monthly report date

Should work be counted in the month based on:

- start date?
- return date?
- another payment date?

## 4. Head quantity

Does the customer always return the exact head structure, or can returned quantities be recorded only as pieces?

## 5. Material/design relationship

Can a design belong to only one material type, or can the same design be used for both material types?

## 6. Customer terminology

Confirm whether the people receiving work should be called:

- Customer
- Worker
- Party
- Karigar
- another local business term

The database can still use `Customer` internally if that is the clearest technical term.

---

# 59. Product Principle

The application should behave like a **digital version of the existing books**, not like a complicated ERP.

The operator should be able to perform the normal workflow in a few clicks:

```text
Customer
   ↓
Design
   ↓
Color
   ↓
Work Type
   ↓
Quantity
   ↓
Rate
   ↓
Start
   ↓
Return
   ↓
Damage/Garbage
   ↓
Complete
   ↓
Monthly Report
```

The primary goal is:

> **Accurate, simple, fast and historical record keeping.**

---

# 60. Final Recommended Stack

```text
Frontend:
Next.js + TypeScript

UI:
Tailwind CSS + shadcn/ui

Forms:
React Hook Form

Validation:
Zod

Backend:
Next.js Server Actions / Route Handlers

ORM:
Prisma

Database:
PostgreSQL

Charts:
Recharts (optional)

Version Control:
Git + GitHub

Deployment:
Vercel

Database Hosting:
Neon / Supabase / another managed PostgreSQL provider
```

---

# 61. Instructions for AI Agent Implementation

When implementing this specification:

1. Build the application incrementally.
2. Do not add authentication in Version 1.
3. Use TypeScript throughout.
4. Use PostgreSQL with Prisma.
5. Keep frontend and backend in one Next.js repository.
6. Use proper relational database design.
7. Do not store multiple colors as comma-separated strings.
8. Store the actual transaction rate separately from the design default rate.
9. Never modify historical transaction values when the design changes.
10. Validate all quantities.
11. Never allow returned + damaged quantity to exceed given quantity.
12. Keep completed historical records.
13. Prefer archive/soft-delete behavior for customers/designs with historical transactions.
14. Keep business calculations outside UI components.
15. Make the application responsive.
16. Keep the interface simple enough for a non-technical operator.
17. Do not introduce unnecessary enterprise features.
18. Use meaningful loading, empty, success and error states.
19. Confirm ambiguous business rules before hard-coding them.
20. Build and test each module before moving to the next module.

The final application should be a clean, small, reliable record-management system that digitally replaces the two physical books used in the current Devanu-Lenvanu workflow.

---

# 62. Mandatory Requirement: Mobile-First Responsive Design

This application will be used **primarily on mobile phones**, so the entire application MUST be designed and developed using a **mobile-first approach**.

Mobile responsiveness is not an optional enhancement. It is a **core functional requirement of Version 1**.

The application must provide an excellent experience on:
- Small Android phones (320px, 360px, 375px)
- Large Android phones and iPhones (390px, 414px, 430px)
- Tablets (768px+)
- Desktop/laptop screens (1024px, 1280px+)

However, **mobile phone usability must be prioritized over desktop design**.

### 62.1 Mobile-First Navigation
- Use a bottom navigation bar for high-frequency thumb-reach actions (`Home`, `Customers`, `Work`, `Reports`) and a compact top header with quick `+` actions.
- Desktop sidebar navigation progressively enhances on large screens (`md:`/`lg:`), while mobile relies on bottom navigation.

### 62.2 Touch-Friendly UI & Hit Targets
- Minimum 44px touch target sizes for buttons, inputs, dropdown items, and clickable rows.
- Zero reliance on `:hover` for critical functionality or data visibility.
- Adequate spacing between interactive elements to prevent accidental taps.

### 62.3 Mobile-First Forms & Keyboard Optimization
- Single-column vertical layout (`Label` → `Input` → `Helper/Error`).
- Proper input types for native mobile keyboards:
  - Phone numbers: `type="tel"`
  - Quantities / Heads / Pieces: `type="number"` / `inputmode="numeric"`
  - Rates / Money: `type="number"` with `step="0.01"` / `inputmode="decimal"`
  - Dates: `type="date"`
  - Search: `type="search"`
- Sticky primary action footer for long forms (`[ Save Work ]`, `[ Complete Return ]`) without obscuring inputs.

### 62.4 Responsive Data Presentation: Cards over Tables
- Mobile presents transactions, customers, designs, and monthly reports as structured, tap-friendly **Card / List items**.
- Horizontal multi-column tables are reserved for tablet/desktop (`md:`, `lg:`) or enclosed in controlled horizontal scroll containers with visual swipe indicators.

### 62.5 Priority Order for Design & Development Decisions
1. Mobile Usability (One-handed touch flow)
2. Data Correctness & Invariant Enforcement
3. Rapid Transaction Entry Speed
4. Readability & Clear Contrast
5. Touch Accessibility ($\ge 44\text{px}$)
6. Performance & Zero Unwanted Layout Shifts
7. Tablet Experience
8. Desktop Experience
9. Visual Polish

