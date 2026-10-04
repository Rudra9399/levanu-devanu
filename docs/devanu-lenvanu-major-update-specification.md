# Devanu-Lenvanu — Major Architecture & Business Flow Update
## Implementation Update Specification for Gemini Agent

**Project:** Devanu-Lenvanu  
**Purpose:** Update the existing implementation according to the new business workflow described below.  
**Important:** This document supersedes the previous **Design Catalog / Design Pattern** workflow wherever it conflicts with this document.

---

# 1. Critical Instruction

The current application has already implemented a `Design` model containing design-level information such as:

- material/category
- pieces per head
- default rate
- colors
- category relations
- design colors

**That design-related model/workflow must now be completely removed from the application.**

The new business requirement is:

> The application does NOT maintain detailed design information in a Design Catalog anymore. It only maintains the **Design Number** as a master/reference.

All operational information required for a work issue order must be selected/entered **at the time of creating the Work Issue (Devanu)**.

Do not preserve the old Design Catalog behavior just for backward compatibility unless it is required to safely migrate existing database records.

---

# 2. New Core Business Concept

The system is now based around:

```text
Masters
   ↓
Worker
   ↓
Work Issue / Devanu
   ↓
Per-Color Work Calculation
   ↓
Return / Lenvanu
   ↓
Outstanding Amount
   ↓
Worker Payment Entry
   ↓
Payment Completed
   ↓
Worker / Design Reports
```

The **Work Issue Order** is now the central operational record.

---

# 3. New Master Structure

The application should maintain only the required master/reference data.

## 3.1 Design Number Master

The Design Number master contains ONLY the design number.

Example:

```text
DESIGN-001
DESIGN-002
DESIGN-003
```

It must NOT contain:

- colors
- material category
- pieces per head
- head quantity
- default cutting type
- default work quantity
- transaction-specific rate

Those values belong to the Work Issue Order.

### Design Number fields

```text
id
designNumber
isActive
createdAt
updatedAt
```

`designNumber` must be unique.

The Design Number Master is simply used so the operator can select a known design number while creating a work issue.

---

# 4. Other Required Masters

The following masters remain required.

## 4.1 Color Master

Examples:

```text
Black
Red
Green
Maroon
Blue
```

Fields:

```text
id
name
isActive
createdAt
updatedAt
```

Color names should be unique.

---

## 4.2 Material Category Master

Examples:

```text
Net
Velvet
Packing
```

Fields:

```text
id
name
isActive
createdAt
updatedAt
```

Category names should be unique.

---

## 4.3 Cutting Style Master

Examples:

```text
Katar Cutting
Reniya Cutting
```

Fields:

```text
id
name
isActive
createdAt
updatedAt
```

Cutting styles should be managed dynamically from the master instead of being hard-coded.

---

## 4.4 Rate Per Piece Master

The new workflow requires a rate reference that can provide a default rate.

The application should maintain the rate information required for the cutting/work calculation.

At minimum the system must support:

```text
rate per piece
```

The rate shown in the Work Issue form should be automatically populated from the applicable default rate, but the operator must be able to manually modify the rate for that particular work issue.

### Important

The final rate used by a Work Issue must be stored as a snapshot on that Work Issue.

Changing a master/default rate later must NOT change historical work issue amounts.

If the existing implementation already has a rate master or rate configuration mechanism, reuse it where possible rather than creating duplicate rate systems.

---

# 5. Worker Master / Worker Directory

The existing `Customer` concept should now be treated as the **Worker** directory in the UI/business terminology.

The worker form should contain:

```text
Worker Name
Phone Number
Address
```

## Phone Number

Only a valid 10-digit Indian mobile number should be accepted.

Example:

```text
9876543210
```

The input should reject invalid lengths/formats.

---

# 6. Work Issue / Devanu — New Main Flow

The Work Issue form is the most important part of the application.

The new form must follow this structure:

```text
Work Issue (Devanu)
        ↓
Worker
        ↓
Design Number
        ↓
Color(s)
        ↓
Category
        ↓
Color-wise Heads
        ↓
Color-wise Pieces per Head
        ↓
Cutting Type
        ↓
Rate per Piece
        ↓
Issue Date
        ↓
Calculation
        ↓
Save Work Issue
```

---

# 7. Worker Selection

The worker must be selected from the existing Worker/Customer directory.

Do not allow arbitrary free-text worker names in a Work Issue.

Example:

```text
Worker
[ Select Worker ▼ ]
```

The dropdown should show workers already registered in the Worker directory.

Where useful, show:

```text
Worker Name
Phone Number
```

inside the selection UI.

---

# 8. Design Number Selection

The design must be selected from the new **Design Number Master**.

Example:

```text
Design Number
[ DESIGN-001 ▼ ]
```

There should be no dependency on a detailed Design model.

Selecting a design number should NOT automatically load:

- fixed colors
- fixed categories
- fixed heads
- fixed pieces/head

Those are now entered/selected for the individual Work Issue.

---

# 9. Color Selection

Multiple colors can be assigned to a single Work Issue.

Example:

```text
Colors:
☑ Black
☑ Red
☑ Green
```

The available colors come from the Color Master.

The selected colors become separate calculation rows.

This is important because:

> Heads and pieces/head are different for each color.

---

# 10. Category Selection

Category is selected according to the work being issued.

The available categories must come from the Material Category Master.

Example:

```text
Category
[ Net ▼ ]
```

The Work Issue must retain the category as a snapshot.

Do not depend on a deleted/changed master value when displaying historical transactions.

---

# 11. Color-Wise Heads

This is a major change from the previous implementation.

**Heads are now color-wise.**

Example:

```text
Color       Heads
-----------------
Black       120
Red         100
Green        50
```

Do NOT have one global `headQuantity` for the complete Work Issue when multiple colors are involved.

Each color has its own head quantity.

---

# 12. Color-Wise Pieces Per Head

Pieces per head are also color-wise.

Example:

```text
Color       Heads    Pieces/Head
--------------------------------
Black       120       10
Red         100       10
Green        50       10
```

The UI must allow each color row to have its own:

```text
heads
piecesPerHead
```

Even if the values are currently the same, they must be stored separately because they may differ.

Example:

```text
Black → 120 heads × 10 pieces
Red   → 100 heads × 8 pieces
Green → 50 heads × 12 pieces
```

---

# 13. Work Issue Calculation

The Work Issue calculation must now happen **per color**.

Example from the provided flow:

```text
Color 1
Heads = 120
Pieces per Head = 10
Rate per Piece = ₹0.25

Amount:
120 × 10 × 0.25
= ₹300
```

```text
Color 2
Heads = 100
Pieces per Head = 10
Rate per Piece = ₹0.25

Amount:
100 × 10 × 0.25
= ₹250
```

```text
Color 3
Heads = 50
Pieces per Head = 10
Rate per Piece = ₹0.25

Amount:
50 × 10 × 0.25
= ₹125
```

Therefore:

```text
Total Work Issue Amount
= ₹300 + ₹250 + ₹125
= ₹675
```

---

# 14. Exact Per-Color Formula

For each Work Issue color row:

```text
Given Pieces
=
Heads × Pieces Per Head
```

Then:

```text
Color Amount
=
Given Pieces × Rate Per Piece
```

And:

```text
Total Work Issue Amount
=
SUM(All Color Amounts)
```

Example:

```text
Black:
120 × 10 = 1200 pieces
1200 × ₹0.25 = ₹300

Red:
100 × 10 = 1000 pieces
1000 × ₹0.25 = ₹250

Green:
50 × 10 = 500 pieces
500 × ₹0.25 = ₹125

Total:
2700 pieces
₹675
```

---

# 15. Rate Logic

The Work Issue rate has two requirements:

1. A default rate should be automatically applied.
2. The user must be able to change the rate before saving the Work Issue.

The rate is associated with the applicable work/cutting configuration and should use the configured default.

The form should behave like:

```text
Rate per Piece
[ ₹0.25 ]
```

The operator can change:

```text
₹0.25 → ₹0.30
```

for this particular Work Issue.

The saved Work Issue must retain:

```text
actualRate = ₹0.30
```

even if the default master rate is later changed.

---

# 16. Cutting Type

Cutting type is selected according to the available Cutting Style Master.

Example:

```text
Cutting Type

○ Katar Cutting
○ Reniya Cutting
```

The selected cutting type must be stored on the Work Issue.

The default rate should be resolved according to the configured business/rate setup, but the operator can override it for the current Work Issue.

---

# 17. Issue Date

The Work Issue must contain:

```text
issueDate
```

This is the date on which the work is actually given to the worker.

Example:

```text
Issue Date
[ 10-08-2026 ]
```

This date is extremely important because the future **Worker Payment** flow uses the Issue Date to determine which orders belong to a selected payment period.

---

# 18. Recommended New Data Model

The old Design-related operational models should be removed/replaced.

The new structure should be conceptually:

```text
DesignNumberMaster
ColorMaster
CategoryMaster
CuttingMaster
RateMaster
Customer / Worker
WorkTransaction
WorkTransactionColor
Payment
PaymentTransaction / PaymentAllocation
```

---

# 19. WorkTransactionColor

Because heads, pieces/head, and amount are now color-wise, the Work Issue needs a child/detail model.

Conceptually:

```text
WorkTransaction
        │
        ├── WorkTransactionColor
        ├── WorkTransactionColor
        └── WorkTransactionColor
```

Each child row should contain at least:

```text
id
workTransactionId
colorId
colorNameSnapshot
heads
piecesPerHead
givenPieces
returnedPieces
damagedPieces
rate
amount
createdAt
updatedAt
```

This is preferable to storing comma-separated colors and one global quantity.

---

# 20. WorkTransaction

The parent Work Transaction should contain:

```text
id
worker/customer id
design number id
design number snapshot
category id
category snapshot
cutting type id
cutting type snapshot
issue date
status
total given pieces
total returned pieces
total damaged pieces
total amount
notes
createdAt
updatedAt
```

The exact fields can be adapted to the existing schema, but the parent/child structure must support color-wise quantities.

---

# 21. Return / Lenvanu Changes

The existing return functionality should be updated to operate at the **color-row level**.

Because a Work Issue can contain:

```text
Black
Red
Green
```

and each has different quantities, the return flow should allow reconciliation per color.

Example:

```text
BLACK
Given:       1200
Returned:    1190
Damaged:       10
Remaining:      0

RED
Given:       1000
Returned:    1000
Damaged:        0
Remaining:      0

GREEN
Given:        500
Returned:     490
Damaged:       10
Remaining:      0
```

Then the Work Issue can become:

```text
COMPLETED
```

only when all color rows are fully accounted for.

---

# 22. Return Validation

For every color:

```text
returnedPieces + damagedPieces <= givenPieces
```

Remaining:

```text
remainingPieces
=
givenPieces
-
returnedPieces
-
damagedPieces
```

The parent Work Issue totals should be calculated from its color rows.

---

# 23. Worker Payment / Outstanding Payment — NEW MAJOR MODULE

A new **Worker Payment** module must be added.

This module represents actual money paid to a worker after a selected period.

The physical/business flow is:

```text
Worker completes work
        ↓
Work Issues accumulate
        ↓
Outstanding amount exists
        ↓
After a chosen period
        ↓
Operator pays worker
        ↓
Operator manually records payment in portal
        ↓
Selected date range orders are marked as payment completed
```

---

# 24. Payment Entry Screen

The payment entry form should contain at minimum:

```text
Worker
[ Select Worker ]

From Date
[ 10-08-2026 ]

To Date
[ 10-10-2026 ]

Payment Amount
[ ₹10,000 ]

Payment Date
[ selected/current date ]

[ Save Payment ]
```

The provided payment-flow screen specifically requires:

```text
Worker Name
Selected Date Range
```

and the payment process must support the actual paid amount.

---

# 25. Payment Date Range Logic

This is a critical business rule.

When the operator selects:

```text
Worker:
Raj

From:
10-08-2026

To:
10-10-2026
```

the system must find that worker's Work Issues where:

```text
issueDate >= 10-08-2026
AND
issueDate <= 10-10-2026
```

The range is based on the **Work Issue / Devanu issue date**, NOT the return date.

This must be explicit in the implementation.

---

# 26. Orders Included in Payment

Only orders belonging to:

```text
selected worker
AND
selected issue-date range
```

should be considered.

Example:

```text
Worker = Raj
Date Range = 10 Aug 2026 → 10 Oct 2026
```

Include:

```text
Issue Date 10 Aug
Issue Date 15 Aug
Issue Date 01 Sep
Issue Date 20 Sep
Issue Date 10 Oct
```

Exclude:

```text
Issue Date 09 Aug
Issue Date 11 Oct
```

---

# 27. Payment Completion

After the operator gives the worker money, the operator manually records the payment.

Example:

```text
Worker:
Raj

Period:
10-08-2026 → 10-10-2026

Payment Given:
₹10,000
```

After saving the payment:

> The Work Issues included in that selected worker + issue-date range must be marked as **payment completed**, according to the payment-allocation rules below.

---

# 28. Important Payment Data Integrity Requirement

Do NOT simply put a single:

```text
paymentDone = true
```

on a Work Transaction without tracking the actual payment event.

A proper payment record must be created.

Recommended structure:

```text
Payment
```

with:

```text
id
workerId
fromDate
toDate
paymentAmount
paymentDate
notes
createdAt
updatedAt
```

And a relation/allocation mechanism connecting the payment to the Work Issues included in that payment.

For example:

```text
Payment
   ↓
PaymentAllocation
   ↓
WorkTransaction
```

---

# 29. Payment Allocation

Recommended model:

```text
PaymentAllocation
```

Fields:

```text
id
paymentId
workTransactionId
allocatedAmount
createdAt
```

This provides a proper audit trail:

```text
Payment #PAY-001
₹10,000
        ↓
Work #001
₹2,500
Work #002
₹3,000
Work #003
₹1,500
Work #004
₹3,000
```

Total allocated:

```text
₹10,000
```

---

# 30. Do Not Silently Lose Payment History

A worker may be paid multiple times over time.

Example:

```text
Payment 1
10 Aug → 10 Oct
₹10,000

Payment 2
11 Oct → 10 Dec
₹8,500
```

Both payment records must remain permanently available.

Never overwrite an older payment record.

---

# 31. Payment Status on Work Orders

Each Work Issue should be able to show payment status.

Suggested statuses:

```text
UNPAID
PARTIALLY_PAID
PAID
```

The existing work completion status remains separate:

```text
PENDING
PARTIALLY_RETURNED
COMPLETED
CANCELLED
```

Do NOT combine work status and payment status into one field.

Example:

```text
Work Status:
COMPLETED

Payment Status:
UNPAID
```

This is valid and important.

---

# 32. Payment and Work Completion

The implementation must keep these two concepts separate:

### Work reconciliation

```text
Given
Returned
Damaged
Remaining
```

### Financial settlement

```text
Payable
Paid
Outstanding
```

A Work Issue can be:

```text
COMPLETED + UNPAID
```

until the worker receives payment.

---

# 33. Outstanding Amount

For a worker:

```text
Total Payable
-
Total Paid
=
Outstanding
```

The Worker Details page should eventually be able to display:

```text
Total Payable:     ₹25,000
Total Paid:        ₹10,000
Outstanding:       ₹15,000
```

Only include transactions/payment allocations according to the defined payment records.

---

# 34. Payment Screen — Recommended UX

The payment screen should first select a worker.

Then show the selected date range.

After date range selection, display a preview:

```text
Worker: Raj

10 Aug 2026 → 10 Oct 2026

Eligible Work Issues
------------------------------------------------
Issue Date   Design     Amount     Payment
10 Aug       D-001      ₹2,500     Unpaid
15 Aug       D-002      ₹3,000     Unpaid
02 Sep       D-003      ₹1,500     Unpaid
20 Sep       D-004      ₹3,000     Unpaid
------------------------------------------------

Total: ₹10,000
```

Then:

```text
Payment Given
[ ₹10,000 ]

[ Complete Payment ]
```

The exact eligible amount must come from the actual Work Issue/payment records rather than hardcoded values.

---

# 35. Payment Amount Validation

Before saving a payment:

- Worker is required.
- From date is required.
- To date is required.
- From date cannot be after To date.
- Payment amount must be greater than or equal to zero.
- The selected worker must match all selected Work Issues.
- The selected date range must use `issueDate`.

If payment allocation is intended to fully settle the selected orders, the system should ensure the amount allocated is consistent with the selected orders' outstanding amounts.

If the business wants to allow a worker to receive a partial payment against the period, the system should support:

```text
PARTIALLY_PAID
```

instead of incorrectly marking all orders as fully paid.

---

# 36. Important Ambiguity to Handle Safely

The requirement says:

> After selecting a date range, all orders in that range are marked as payment done after the payment entry.

However, the example also gives a manually entered payment amount.

Therefore, the implementation should NOT assume that the entered payment amount is always equal to the total outstanding amount.

Use the following safe behavior:

### If payment amount = total outstanding

```text
All eligible orders → PAID
```

### If payment amount < total outstanding

```text
Do not mark all orders as PAID.
Create partial payment allocation.
Affected orders → PARTIALLY_PAID where necessary.
```

The UI should show the difference clearly.

Example:

```text
Outstanding for selected period: ₹12,000
Payment given:                   ₹10,000

Remaining outstanding:            ₹2,000
```

This preserves financial accuracy.

---

# 37. Payment History

Add a Payment History section.

Filters:

```text
Worker
From Date
To Date
```

Each payment record should display:

```text
Worker
Payment Date
Period From
Period To
Amount
Status
```

Opening a payment should show:

```text
Payment Details
        ↓
Worker
        ↓
Date Range
        ↓
Payment Date
        ↓
Amount
        ↓
Allocated Work Issues
```

---

# 38. Worker Details Update

The Worker Details page should now include financial information.

Recommended summary:

```text
Active Work
Completed Work
Total Payable
Total Paid
Outstanding
```

Then tabs/sections:

```text
Active Work
Work History
Payments
```

---

# 39. New Worker Report Requirements

Reports must now support worker-wise analysis.

At minimum:

```text
Worker Report
```

Filters:

```text
Worker
From Date
To Date
```

Show:

```text
Total Work Issues
Total Given Pieces
Total Returned Pieces
Total Damaged Pieces
Total Payable
Total Paid
Outstanding
```

---

# 40. Design-Wise Reports

Reports must also support design-wise analysis.

Because the old detailed Design model is being removed, the report should use the **Design Number stored on Work Issues**.

Example:

```text
Design-001

Total Orders:          15
Total Given Pieces:    25,000
Total Returned:        24,700
Total Damaged:            300
Total Amount:          ₹6,250
```

Filters can include:

```text
Design Number
From Date
To Date
Worker
```

---

# 41. Worker + Design Report

The system should support analyzing:

```text
Worker + Design
```

Example:

```text
Worker: Raj
Design: DESIGN-001

Orders: 5
Given Pieces: 8,000
Returned: 7,900
Damaged: 100
Payable: ₹2,000
Paid: ₹1,500
Outstanding: ₹500
```

This is useful for understanding how much work a particular worker performed for a particular design.

---

# 42. Report Date Logic

Reports involving Work Issues should clearly distinguish date types.

### Work Issue reports

Use:

```text
issueDate
```

### Return reports

Use:

```text
returnDate
```

### Payment reports

Use:

```text
paymentDate
```

### Payment eligibility by period

Use:

```text
WorkTransaction.issueDate
```

Do not mix these dates.

---

# 43. Existing Design Module Migration

The old Design module currently contains:

```text
Design
DesignCategory
DesignColor
```

and design-level:

```text
materialType
headQuantity
piecesPerHead
categoryPieces
defaultRate
colors
```

These should no longer be the source of truth.

Replace the old flow with:

```text
Design Number Master
```

only.

---

# 44. Database Migration Requirement

Do NOT immediately delete old tables in production without considering existing data.

The AI agent should:

1. Inspect the existing database and current usage.
2. Determine whether existing Work Transactions depend on old Design records.
3. Add the new schema.
4. Migrate required historical Design Number information into the new Design Number Master.
5. Update Work Transactions to reference the new design number structure.
6. Preserve historical transaction snapshots.
7. Only after successful migration remove obsolete relations/tables.

Never run a destructive database reset against production.

Do NOT use:

```bash
prisma migrate reset
```

for production data migration.

---

# 45. Recommended New Database Structure

Conceptually:

```text
ColorMaster
CategoryMaster
CuttingMaster
DesignNumberMaster
RateMaster
Customer
WorkTransaction
WorkTransactionColor
Payment
PaymentAllocation
```

Optional future models:

```text
PaymentAdjustment
AuditLog
```

Do not add future models unless they are actually needed.

---

# 46. Suggested Prisma Concept

A conceptual structure:

```prisma
model DesignNumberMaster {
  id           String   @id @default(cuid())
  designNumber String   @unique
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  transactions WorkTransaction[]
}
```

---

## WorkTransaction

Conceptually:

```prisma
model WorkTransaction {
  id                 String   @id @default(cuid())

  customerId         String
  designNumberId     String

  designNumberSnapshot String

  categoryId         String?
  categorySnapshot   String?

  cuttingStyleId     String?
  cuttingStyleSnapshot String?

  issueDate          DateTime

  totalGivenPieces   Int      @default(0)
  totalReturnedPieces Int     @default(0)
  totalDamagedPieces Int      @default(0)

  totalAmount        Decimal  @db.Decimal(10, 2)

  workStatus         TransactionStatus @default(PENDING)
  paymentStatus      PaymentStatus @default(UNPAID)

  notes              String?

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  customer           Customer @relation(fields: [customerId], references: [id])
  designNumber       DesignNumberMaster @relation(fields: [designNumberId], references: [id])

  colorRows          WorkTransactionColor[]
  paymentAllocations PaymentAllocation[]

  @@index([customerId])
  @@index([designNumberId])
  @@index([issueDate])
  @@index([workStatus])
  @@index([paymentStatus])
}
```

---

## WorkTransactionColor

```prisma
model WorkTransactionColor {
  id                  String   @id @default(cuid())

  workTransactionId   String
  colorId             String
  colorNameSnapshot   String

  heads               Int
  piecesPerHead      Int
  givenPieces         Int

  returnedPieces      Int      @default(0)
  damagedPieces       Int      @default(0)

  rate                Decimal  @db.Decimal(10, 2)
  amount              Decimal  @db.Decimal(10, 2)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  workTransaction     WorkTransaction @relation(fields: [workTransactionId], references: [id], onDelete: Cascade)
  color               ColorMaster @relation(fields: [colorId], references: [id])

  @@index([workTransactionId])
  @@index([colorId])
}
```

---

## Payment

```prisma
model Payment {
  id             String   @id @default(cuid())

  customerId     String

  fromDate       DateTime
  toDate         DateTime

  paymentDate    DateTime
  paymentAmount  Decimal  @db.Decimal(10, 2)

  notes          String?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  customer       Customer @relation(fields: [customerId], references: [id])

  allocations    PaymentAllocation[]

  @@index([customerId])
  @@index([paymentDate])
  @@index([fromDate])
  @@index([toDate])
}
```

---

## PaymentAllocation

```prisma
model PaymentAllocation {
  id                String   @id @default(cuid())

  paymentId         String
  workTransactionId String

  allocatedAmount   Decimal  @db.Decimal(10, 2)

  createdAt         DateTime @default(now())

  payment           Payment @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  workTransaction   WorkTransaction @relation(fields: [workTransactionId], references: [id])

  @@unique([paymentId, workTransactionId])
  @@index([paymentId])
  @@index([workTransactionId])
}
```

---

# 47. Payment Status Enum

Use a separate payment status:

```prisma
enum PaymentStatus {
  UNPAID
  PARTIALLY_PAID
  PAID
}
```

Do not reuse `TransactionStatus` for payments.

---

# 48. Work Status vs Payment Status

Example:

```text
Work Status:
COMPLETED

Payment Status:
UNPAID
```

Later:

```text
Work Status:
COMPLETED

Payment Status:
PAID
```

This distinction is mandatory.

---

# 49. New Navigation

Update the navigation to include:

```text
Dashboard
Workers
Design Numbers
Masters
Work / Devanu
Payments
Reports
```

Reports can contain:

```text
Monthly Hisab
Worker Report
Design Report
Payment History
```

---

# 50. Mobile-First Requirement

The application is primarily used on mobile phones.

All new screens must be designed mobile-first.

Especially:

```text
New Work / Devanu
Record Return / Lenvanu
Worker Payment
Worker Details
Reports
```

must be comfortable on a phone.

The Work Issue form should use a vertical color-row structure rather than a wide desktop-only table.

Example mobile row:

```text
┌───────────────────────────────┐
│ Black                         │
│                               │
│ Heads                         │
│ [ 120 ]                       │
│                               │
│ Pieces / Head                 │
│ [ 10 ]                        │
│                               │
│ Given Pieces: 1,200           │
│ Rate: ₹0.25                   │
│ Amount: ₹300                  │
└───────────────────────────────┘
```

Repeat for each selected color.

---

# 51. Desktop Work Issue Layout

On desktop, color rows can be displayed as a structured table:

```text
| Color | Heads | Pieces/Head | Given Pieces | Rate | Amount |
|-------|------:|------------:|-------------:|-----:|-------:|
| Black | 120   | 10          | 1,200        | 0.25 | 300    |
| Red   | 100   | 10          | 1,000        | 0.25 | 250    |
| Green | 50    | 10          | 500          | 0.25 | 125    |
```

Bottom:

```text
Total Given Pieces: 2,700
Total Amount: ₹675
```

---

# 52. Work Issue Validation

Before saving:

```text
Worker required
Design Number required
At least one color required
Category required
Cutting Type required
Issue Date required
Heads > 0 for every color
Pieces per Head > 0 for every color
Rate >= 0
```

Calculated values:

```text
givenPieces = heads × piecesPerHead
amount = givenPieces × rate
```

must be generated server-side as well as displayed client-side.

Never trust only client-side calculations for financial values.

---

# 53. Atomic Work Issue Creation

Creating a Work Issue must be performed as one database transaction.

Conceptually:

```text
BEGIN TRANSACTION

Create WorkTransaction

Create WorkTransactionColor rows

Calculate totals

Store snapshots

COMMIT
```

If any color row fails, the complete Work Issue should fail rather than creating an incomplete record.

Use:

```text
prisma.$transaction()
```

---

# 54. Atomic Payment Creation

Payment creation must also be transactional.

Conceptually:

```text
BEGIN TRANSACTION

Create Payment

Create PaymentAllocation rows

Update affected WorkTransaction payment statuses

COMMIT
```

If any allocation fails, do not save a partial payment.

---

# 55. Payment Range Query

The eligible Work Issues should be found using:

```text
customerId = selectedWorker
AND issueDate >= fromDate
AND issueDate <= toDate
```

The implementation must account correctly for the end date/time so the entire selected end date is included.

---

# 56. Payment Preview

Before the operator confirms payment, show:

```text
Worker
Date Range

Number of Work Issues
Total Payable
Already Paid
Outstanding
Payment Being Given
Remaining Outstanding
```

Example:

```text
Worker: Raj

10 Aug 2026 → 10 Oct 2026

Work Issues:             8
Total Payable:       ₹15,000
Already Paid:         ₹5,000
Outstanding:         ₹10,000

Payment Given:       ₹10,000
Remaining:                ₹0
```

Then:

```text
[ Complete Payment ]
```

---

# 57. Payment Completion Behavior

When a payment exactly settles the outstanding amount for the selected records:

```text
Payment Status → PAID
```

If only part of the outstanding amount is paid:

```text
Payment Status → PARTIALLY_PAID
```

and the remaining amount remains outstanding.

Never mark a transaction as fully paid merely because it falls inside a selected date range if its financial amount has not actually been settled.

---

# 58. Reports — Minimum Required

## Worker Report

Filters:

```text
Worker
From Date
To Date
```

Metrics:

```text
Orders
Given Pieces
Returned Pieces
Damaged Pieces
Payable
Paid
Outstanding
```

---

## Design Report

Filters:

```text
Design Number
From Date
To Date
Worker
```

Metrics:

```text
Orders
Given Pieces
Returned Pieces
Damaged Pieces
Payable
Paid
Outstanding
```

---

## Monthly Hisab

Keep the existing monthly Hisab functionality, but update it to work with:

- new Design Number Master
- color-wise Work Issue rows
- new payment status
- actual Payment records
- outstanding amount

---

# 59. Report Calculation Source of Truth

Do not maintain manually entered totals.

Reports should derive from:

```text
WorkTransaction
WorkTransactionColor
Payment
PaymentAllocation
```

This keeps the reports consistent with the ledger.

---

# 60. Migration From Existing Implementation

The current implementation already contains:

```text
Design
DesignCategory
DesignColor
WorkTransaction
```

The AI agent must carefully migrate the application.

### Required sequence

1. Back up the existing database.
2. Inspect existing schema and existing records.
3. Identify all existing design numbers.
4. Create Design Number Master records.
5. Map existing Work Transactions to Design Number Master.
6. Preserve existing transaction snapshots.
7. Introduce WorkTransactionColor.
8. Migrate existing color/quantity data into color rows where possible.
9. Introduce Payment and PaymentAllocation.
10. Introduce payment status separately from work status.
11. Update server actions.
12. Update reports.
13. Update UI.
14. Test historical records.
15. Only then remove obsolete Design/DesignCategory/DesignColor structures.

Do not silently destroy existing historical data.

---

# 61. Important Historical Data Principle

Historical Work Issue records must remain readable after the migration.

A historical Work Issue should still show:

```text
Worker
Design Number
Color
Category
Heads
Pieces/Head
Given Pieces
Rate
Cutting Type
Issue Date
Return information
Amount
Payment status
```

even if the corresponding master records are later renamed/deactivated.

Therefore snapshots are required where appropriate.

---

# 62. UI Terminology

Use the business terms consistently:

```text
Worker
Design Number
Color
Category
Cutting Type
Devanu / Work Issue
Lenvanu / Return
Payment
Outstanding
Hisab
```

Do not bring back the old terminology of a detailed "Design Catalog" with design specifications.

The Design Number is simply a reference/master.

---

# 63. Acceptance Criteria

The update is complete only when all of the following are true:

### Design

- Old detailed Design Catalog is removed from the operational workflow.
- Design Number Master exists.
- Design Number is unique.
- No color/category/pieces/head data is stored as Design Master configuration.

### Work Issue

- Worker selected from Worker Master.
- Design Number selected from Design Number Master.
- Multiple colors supported.
- Category selected from Category Master.
- Heads entered per color.
- Pieces/head entered per color.
- Cutting type selected from Cutting Master.
- Rate automatically populated from configured default.
- Rate can be overridden.
- Issue date recorded.
- Given pieces calculated per color.
- Amount calculated per color.
- Total amount calculated correctly.

### Return

- Return works per color.
- Returned and damaged quantities validated.
- Remaining quantity calculated.
- Work status updated correctly.

### Payment

- Worker selected.
- From date selected.
- To date selected.
- Eligible orders determined using issue date.
- Payment amount entered manually.
- Payment record stored.
- Payment allocations stored.
- Work payment status updated.
- Partial payment remains possible.
- Outstanding amount remains accurate.
- Payment history is retained.

### Reports

- Worker-wise report.
- Design-wise report.
- Worker + Design analysis.
- Monthly Hisab updated.
- Paid/outstanding values included.

### Data Safety

- No production database reset.
- Existing historical records preserved.
- Financial calculations performed server-side.
- Payment creation is transactional.
- Work Issue creation is transactional.

---

# 64. Final Implementation Instruction to Gemini Agent

You are updating an **existing production-style Next.js + PostgreSQL + Prisma application**, not starting a new project.

Before modifying code:

1. Inspect the current implementation.
2. Inspect the existing Prisma schema.
3. Inspect current Server Actions.
4. Inspect existing Work Issue and Return flows.
5. Inspect existing Design, DesignCategory and DesignColor usage.
6. Inspect existing reports.
7. Identify all dependencies on the old Design model.

Then implement the new architecture described in this document.

### Most important changes

```text
OLD

Design
 ├── Categories
 ├── Colors
 ├── Pieces/Head
 ├── Rate
 └── other design configuration

NEW

Design Number Master
 └── Design Number only
```

and:

```text
NEW WORK ISSUE

Worker
  +
Design Number
  +
Color 1 → Heads → Pieces/Head → Given Pieces → Rate → Amount
Color 2 → Heads → Pieces/Head → Given Pieces → Rate → Amount
Color 3 → Heads → Pieces/Head → Given Pieces → Rate → Amount
  +
Category
  +
Cutting Type
  +
Issue Date
  =
Work Issue
```

and:

```text
NEW PAYMENT

Worker
  +
From Date
  +
To Date
  +
Issue-Date Based Work Issues
  +
Payment Amount
  =
Payment
  ↓
Payment Allocations
  ↓
PAID / PARTIALLY_PAID
```

Do not implement the new payment system as a simple boolean flag.

Do not keep the old detailed Design Catalog merely because it already exists.

Do not delete production data.

Do not reset the database.

Preserve historical records and financial accuracy.

Build the new implementation incrementally, verify each migration, and keep the application fully mobile responsive.
