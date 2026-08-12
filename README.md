# Fundsroom ERP & CRM

A full-stack ERP and CRM application for managing customers, products, inventory, stock movements, sales challans, alerts, and day-to-day business operations through a centralized web platform.

The application uses a React and TypeScript frontend, a Node.js and Express backend, and PostgreSQL for persistent data storage.

---

# 🚀 Live Application

### 🌐 Live Project

👉 [Open Fundsroom ERP & CRM](https://fundsroom-frontend-psi.vercel.app)

### 🔧 Backend API

👉 [Fundsroom Backend API](https://fundsroom-backend-v2.onrender.com)

### ❤️ Backend Health Check

👉 [Check API Health](https://fundsroom-backend-v2.onrender.com/api/health)

---

## 📌 Project Overview

Fundsroom ERP & CRM is designed to provide a centralized platform for managing business operations.

The system combines CRM, inventory, stock management, and sales challan functionality into one application.

### Main capabilities

- User authentication
- Role-based authorization
- Customer management
- Product management
- Inventory management
- Stock IN and OUT operations
- Low-stock alerts
- Sales challan management
- Dashboard and business overview
- PostgreSQL database persistence
- Production deployment

---

# ✨ Features

## 🔐 Authentication & Authorization

- JWT-based authentication
- Secure password hashing using bcryptjs
- User login
- Logout functionality
- Protected application functionality
- Role-based authorization
- Backend API authorization

---

## 👥 Customer Management

- Create customers
- View customer list
- View customer details
- Update customer information
- Customer type management
- Customer status management
- GST information
- Business information
- Follow-up dates
- Customer notes

### Customer Types

- Retail
- Wholesale
- Distributor

### Customer Status

- Lead
- Active
- Inactive

---

## 📦 Product Management

- Create products
- View products
- Update product information
- SKU management
- Product categories
- Unit pricing
- Current stock tracking
- Minimum stock levels
- Warehouse location

---

## 📊 Inventory & Stock Management

- Stock IN operations
- Stock OUT operations
- Stock movement reasons
- Automatic stock quantity updates
- Insufficient-stock validation
- Low-stock identification
- Stock movement history
- Product-based stock filtering

---

## ⚠️ Low-Stock Alerts

The system identifies products whose current stock reaches or falls below the configured minimum stock level.

This allows users to identify products that require replenishment.

---

## 🧾 Sales Challans

- Create sales challans
- Associate challans with customers
- Add products and quantities
- Generate challan numbers
- Manage challan status
- Confirm challans
- Cancel challans
- Automatic stock deduction when a challan is confirmed
- Product and pricing information associated with challan items

---

## 📈 Dashboard

The dashboard provides a centralized overview of the business application.

It includes:

- Business information
- User information
- Role information
- Quick access to major ERP modules
- Inventory-related information
- Business management overview

---

# 👤 User Roles

The application supports four primary roles:

| Role | Access |
|------|--------|
| ADMIN | Full system access |
| SALES | Customer and sales/challan operations |
| WAREHOUSE | Inventory and stock operations |
| ACCOUNTS | Dashboard/business overview |

### ADMIN

Full access to the major ERP modules including:

- Customers
- Products
- Inventory
- Stock
- Challans
- Dashboard

### SALES

Access to:

- Customers
- Sales challans
- Related sales operations

### WAREHOUSE

Access to:

- Products
- Inventory
- Stock movements
- Stock management

### ACCOUNTS

Access primarily focused on:

- Dashboard
- Business overview

> Authorization is enforced on the backend API rather than relying only on frontend navigation.

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      User / Browser  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ React + TypeScript   │
                    │        Vercel        │
                    └──────────┬───────────┘
                               │
                         REST API / JWT
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Express + TypeScript │
                    │       Render         │
                    └──────────┬───────────┘
                               │
                          node-postgres
                               │
                               ▼
                    ┌──────────────────────┐
                    │     PostgreSQL       │
                    │       Render         │
                    └──────────────────────┘  