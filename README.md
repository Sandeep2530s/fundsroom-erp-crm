# Fundsroom ERP + CRM

A full-stack ERP + CRM application for customer management, product management, inventory tracking, and sales challan processing.

## Features

### Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization
- Supported roles:
  - ADMIN
  - SALES
  - WAREHOUSE
  - ACCOUNTS
- Protected backend API routes

### Customer Management
- Create and manage customers
- Customer type:
  - RETAIL
  - WHOLESALE
  - DISTRIBUTOR
- Customer status:
  - LEAD
  - ACTIVE
  - INACTIVE
- Follow-up notes and follow-up dates

### Product Management
- Create and update products
- SKU management
- Product categories
- Unit pricing
- Warehouse location
- Minimum-stock threshold

### Inventory
- Stock IN
- Stock OUT
- Stock movement history
- Automatic stock updates
- Low-stock detection
- Protection against negative stock

### Sales Challans
- Select a customer
- Add multiple products
- Set quantities
- Product and price snapshot on the challan
- Save Draft
- Reuse Draft
- Confirm Challan
- View Challan
- Cancel Challan
- Automatic stock deduction on confirmation
- Automatic stock restoration when a confirmed challan is cancelled
- Challan status:
  - DRAFT
  - CONFIRMED
  - CANCELLED
- Challan history and refresh
- Duplicate products within a challan are prevented

### Dashboard
- Total products
- Total stock
- Low-stock count
- Recent stock movements
- Recent challans
- Dashboard data synchronized with inventory/challan activity

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- CSS

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL
- `pg`
- JWT
- bcryptjs
- Zod
- tsx

## Project Structure

```text
fundsroom-erp-crm/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── app.ts
│   │   ├── db.ts
│   │   ├── seedUsers.ts
│   │   └── server.ts
│   ├── schema.sql
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── .gitignore
```

## Prerequisites

Install:

- Node.js
- npm
- PostgreSQL

A PostgreSQL database must be available before starting the backend.

## Database Setup

Create a PostgreSQL database for the project.

Then execute:

```text
backend/schema.sql
```

The schema creates the required tables, relationships, constraints, and indexes.

The main tables are:

- `users`
- `customers`
- `products`
- `stock_movements`
- `challans`
- `challan_items`

## Backend Environment

Create:

```text
backend/.env
```

Do **not** commit this file to Git.

The backend requires these environment variables:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
```

Use your own PostgreSQL connection string and a strong private JWT secret.

## Install Backend Dependencies

```powershell
cd backend
npm install
```

## Start Backend in Development

```powershell
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

## Build Backend

```powershell
npm run build
```

## Frontend Installation

Open another terminal:

```powershell
cd frontend
npm install
```

## Start Frontend in Development

```powershell
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## Build Frontend

```powershell
npm run build
```

## Application Workflow

### 1. Login

Authenticate with a valid user account.

The backend returns a JWT containing the authenticated user's ID and role.

### 2. Customer

Create or select a customer before creating a sales challan.

### 3. Product

Products contain:

- Name
- SKU
- Category
- Unit price
- Current stock
- Minimum stock alert quantity
- Warehouse location

### 4. Inventory

Use Stock IN and Stock OUT to maintain inventory.

Every movement is recorded in `stock_movements`.

### 5. Create Draft

A sales user can:

1. Select a customer.
2. Add one or more products.
3. Set quantities.
4. Save the challan as a draft.

Draft creation does not reduce inventory.

### 6. Reuse Draft

A draft can be reused to create another working challan.

The quantities can be adjusted before saving or confirming.

Inventory is affected only when the challan is confirmed.

### 7. Confirm Challan

When a challan is confirmed:

- The challan status becomes `CONFIRMED`.
- Product stock is reduced.
- An `OUT` stock movement is recorded.
- Product name, SKU, and price are preserved as snapshots on the challan item.

### 8. Cancel Challan

When a confirmed challan is cancelled:

- The status becomes `CANCELLED`.
- The previously deducted stock is restored.
- An `IN` stock movement is recorded.

A cancelled challan cannot be cancelled again.

## Role Permissions

| Feature | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|---|---:|---:|---:|---:|
| View customers | Yes | Yes | Yes | Yes |
| Create/update customers | Yes | Yes | No | No |
| Follow-up notes | Yes | Yes | No | No |
| View products | Yes | Yes | Yes | Yes |
| Create/update products | Yes | No | Yes | No |
| Stock IN | Yes | No | Yes | No |
| Stock OUT | Yes | No | Yes | No |
| View stock movements | Yes | Yes | Yes | Yes |
| Create challans | Yes | Yes | No | No |
| Cancel challans | Yes | Yes | No | No |
| Dashboard | Yes | Yes | Yes | Yes |
| Low-stock alerts | Yes | Yes | Yes | Yes |

## Data Integrity

The database enforces important constraints including:

- Unique user email
- Unique product SKU
- Unique challan number
- Valid user roles
- Valid customer types
- Valid customer statuses
- Valid challan statuses
- Non-negative product stock
- Non-negative product prices
- Positive stock movement quantities
- Positive challan item quantities
- Valid foreign-key relationships
- One product per challan line
- Non-negative historical unit-price snapshots

## Transaction Safety

Stock-changing challan operations use database transactions.

This prevents partially completed operations such as:

- Creating a challan without its items
- Deducting stock without recording the challan
- Restoring stock without cancelling the challan

Products involved in challan confirmation are locked during the transaction to reduce concurrent stock-update problems.

Challan-number generation is also serialized to prevent concurrent requests from generating the same challan number.

## Security

- Passwords are stored as bcrypt hashes.
- SQL queries use parameterized values.
- JWTs expire after one day.
- Protected API routes require authentication.
- Write operations are restricted by role.
- `.env` is excluded from Git.
- Password hashes are never returned by the login API.

## Validation

The backend validates important business conditions, including:

- Required customer
- Valid customer ID
- Valid product IDs
- Positive integer quantities
- Existing products
- Existing customers
- Duplicate products within a challan
- Sufficient stock before confirmation
- Valid challan status
- Valid resource IDs

## Development Commands

### Backend

```powershell
cd backend
npm install
npm run dev
npm run build
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
npm run build
```

## Important Security Note

Never commit:

```text
backend/.env
```

The repository `.gitignore` already excludes environment files, dependency directories, build output, logs, and local backup directories.

## Final Verification

Before submission or deployment, verify:

```powershell
cd backend
npm run build
```

and:

```powershell
cd frontend
npm run build
```

Both commands should complete without TypeScript or Vite build errors.

## Author

**Sandeep D**  
B.E. — Computer Science & Engineering (IoT, Cyber Security & Blockchain)  
Dayananda Sagar Academy of Technology and Management, Bangalore  

- GitHub: https://github.com/Sandeep2530s
- LinkedIn: https://linkedin.com/in/sandeep-d-653aa4339

## Project Status

Core ERP + CRM functionality has been implemented and tested, including authentication, customer management, product management, inventory, sales challans, draft reuse, stock synchronization, cancellation, dashboard synchronization, database constraints, and role-based authorization.
