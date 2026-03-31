# Swagger Documentation Guide

This document provides a comprehensive guide to the Swagger APIs for the Banking Application. It includes access instructions, route details, and a summary of all request/response fields.

---

## 1. How to Access Swagger UI

The microservices are deployed inside a Kubernetes cluster. To access the Swagger UI, use the following public URLs:

| Service | Kubernetes Ingress (Port 80) | Local NodePort Access |
| :--- | :--- | :--- |
| **Auth Service** | [http://localhost/public/auth/api/docs](http://localhost/public/auth/api/docs) | [http://localhost:30000/public/auth/api/docs](http://localhost:30000/public/auth/api/docs) |
| **Account Service** | [http://localhost/public/account/api/docs](http://localhost/public/account/api/docs) | [http://localhost:30001/public/account/api/docs](http://localhost:30001/public/account/api/docs) |
| **Customer Service** | [http://localhost/public/customer/api/docs](http://localhost/public/customer/api/docs) | [http://localhost:30002/public/customer/api/docs](http://localhost:30002/public/customer/api/docs) |

### 🛠️ Local Swagger UI (Standalone)
If you have a standalone Swagger UI running on port `8080`, you can use these clickable links to load the API definitions directly:

- **Auth API**: [http://localhost:8080/?url=http://localhost:30000/public/auth/api/docs-json](http://localhost:8080/?url=http://localhost:30000/public/auth/api/docs-json)
- **Account API**: [http://localhost:8080/?url=http://localhost:30001/public/account/api/docs-json](http://localhost:8080/?url=http://localhost:30001/public/account/api/docs-json)
- **Customer API**: [http://localhost:8080/?url=http://localhost:30002/public/customer/api/docs-json](http://localhost:8080/?url=http://localhost:30002/public/customer/api/docs-json)

> [!NOTE]
> These paths are "Public" and bypass the Authentication Guard so that you can view the documentation without logging in first.

---

## 2. Authentication Requirements

### Auth Service
- **Session-Based**: The `login` endpoint sets a secure `banking_session` cookie.
- **Protected Routes**: Endpoints like `change-password` require this cookie to be present.

### Account & Customer Services
- **Header-Based**: These services are protected by the API Gateway.
- **X-User-ID**: The Gateway automatically injects an `X-User-ID` header into requests after validating your session cookie.
- **External Testing**: If you are testing these services directly (via NodePort or Port-Forward), you must manually provide the `X-User-ID` header in the Swagger "Authorize" dialog.

---

## 3. API Route Breakdown

### 🔐 Auth Service
Handles identity and sessions.

| Route | Method | Description | Request Body | Success Response |
| :--- | :--- | :--- | :--- | :--- |
| `/auth/register` | `POST` | Create a new account | `email`, `password`, `role?` | `201: { message, userId }` |
| `/auth/login` | `POST` | Authenticate & get cookie | `email`, `password` | `201: { message, userId }` |
| `/auth/logout` | `POST` | Terminate session | None | `201: { message }` |
| `/auth/forgot-password`| `POST` | Request password reset | `email` | `201: { message }` |
| `/auth/change-password`| `POST` | Update password | None (uses session) | `201: { message }` |

**Field Details (Auth):**
- **email**: Valid email format string (Required).
- **password**: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char.
- **role**: Optional string (default: `customer`).

---

### 💳 Account Service
Handles banking accounts and transactions.

| Route | Method | Description | Request Body | Success Response |
| :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | Service status | None | `200: { status, service }` |
| `/:id` | `GET` | Get account details | None (Param: `id`) | `200: { accountDetails }` |
| `/:id/add` | `POST` | Deposit funds | `amount`, `customer` | `201: { message }` |
| `/:id/withdraw` | `POST` | Withdraw funds | `amount`, `customer` | `201: { message }` |
| `/:id` | `DELETE`| Close account | None (Param: `id`) | `200: { message }` |

**Field Details (Account):**
- **id**: UUID of the account (Path Parameter).
- **amount**: Positive number (Required for transactions).
- **customer**: The owner object or ID associated with the account.

---

### 👤 Customer Service
Handles KYC and profile data.

| Route | Method | Description | Request Body | Success Response |
| :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | Service status | None | `200: { status, service }` |
| `/` | `POST` | Create profile | `name`, `email`, `address` | `201: { customerDetails }` |

**Field Details (Customer):**
- **name**: Full legal name string (Required).
- **email**: Contact email string (Required).
- **address**: Physical address string (Required).

---

## 4. Summary Table

| Service | Method | Route | Auth Type | Input Fields |
| :--- | :--- | :--- | :--- | :--- |
| Auth | POST | `/auth/register` | Public | email, password, role |
| Auth | POST | `/auth/login` | Public | email, password |
| Auth | POST | `/auth/logout` | Session | None |
| Account | GET | `/health` | Public | None |
| Account | GET | `/:id` | X-User-ID | id (Param) |
| Account | POST | `/:id/add` | X-User-ID | id, amount, customer |
| Customer| POST | `/` | X-User-ID | name, email, address |
| Customer| GET | `/health` | Public | None |
