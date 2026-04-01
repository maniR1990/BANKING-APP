# API Flow — Banking Microservices

## Services Overview

| Service | Port | Ingress Prefix | Global Prefix |
|---------|------|----------------|---------------|
| Auth | 3000 | `/auth` | `auth` |
| Account | 3001 | `/account` | `api` |
| Customer | 3002 | `/customer` | `api` |

---

## Auth Service — `/auth/*`

| Method | Route | Auth Required | Description |
|--------|-------|---------------|-------------|
| `POST` | `/auth/register` | No | Create user → emits `USER_CREATED` to RabbitMQ → provisions Account + Customer records automatically |
| `POST` | `/auth/login` | No | Validate credentials → creates Redis session → sets `banking_session` cookie |
| `POST` | `/auth/logout` | Cookie | Clears Redis session + cookie |
| `POST` | `/auth/change-password` | Cookie | Invalidates all sessions for the user |
| `POST` | `/auth/forgot-password` | No | Mocked — sends password reset link |
| `GET` | `/auth/validate` | Internal | Called by NGINX on every protected request to check session cookie |
| `GET` | `/auth/health` | No | Health check |

---

## Session Guard — How Every Protected Request Works

Every request to `/account/*` or `/customer/*` passes through NGINX's `auth_request` module before reaching the service:

```
Client Request
    │
    ▼
NGINX Ingress
    │
    ├──► GET /auth/validate?uri=<original_uri>   (NGINX sub-request)
    │         Reads banking_session cookie from Redis
    │         ◄── 200 + X-User-ID header  →  allow
    │         ◄── 401                     →  reject (403 to client)
    │
    ▼ (if allowed)
Account / Customer Service
    (receives X-User-ID header injected by NGINX)
```

Paths under `/public/*` bypass the auth check entirely.

---

## Customer Service — `/customer/*`

| Method | Route | Auth Required | Description |
|--------|-------|---------------|-------------|
| `POST` | `/customer` | Cookie | Manually create a customer profile |
| `GET` | `/customer` | Cookie | List all customers |
| `GET` | `/customer/:id` | Cookie | Get customer by ID (falls back to lookup by `userId`) |
| `PATCH` | `/customer/:id` | Cookie | Update customer details |
| `DELETE` | `/customer/:id` | Cookie | Delete customer → emits `CUSTOMER_DELETED` event |
| `GET` | `/customer/health` | No | Health check |

### RabbitMQ Listeners (not HTTP)

| Pattern | Type | Trigger | Action |
|---------|------|---------|--------|
| `user.created` | EventPattern (fire-and-forget) | User registers | Auto-creates customer KYC profile |
| `customer.verify` | MessagePattern (RPC) | Account service validates | Returns `true`/`false` if customer exists |
| `customer.get` | MessagePattern (RPC) | Account service fetches | Returns full customer record |

---

## Account Service — `/account/*`

| Method | Route | Auth Required | Description |
|--------|-------|---------------|-------------|
| `GET` | `/account` | No | API root ping |
| `GET` | `/account/health` | No | Health check |
| `GET` | `/account/:id` | Cookie | Get account by account ID |
| `GET` | `/account/customer/:customerId` | Cookie | Get account by customer ID |
| `POST` | `/account/:id/add` | Cookie | Add money — requires `{ amount, customerId }` → validates customer via RPC first |
| `POST` | `/account/:id/withdraw` | Cookie | Withdraw money — same validation as add |
| `DELETE` | `/account/:id` | Cookie | Delete account by ID |

### RabbitMQ Listeners (not HTTP)

| Pattern | Type | Trigger | Action |
|---------|------|---------|--------|
| `user.created` | EventPattern (fire-and-forget) | User registers | Auto-creates a checking account |
| `customer.deleted` | EventPattern (fire-and-forget) | Customer deleted | Deletes all accounts for that customer |

---

## RabbitMQ Exchange Architecture

```
Auth Service (publisher)
    │
    ├──► account_queue ──► Account Service (consumer)
    │         USER_CREATED
    │
    └──► banking_queue ──► Customer Service (consumer)
              USER_CREATED

Customer Service (publisher)
    │
    └──► banking_queue ──► Account Service via banking_exchange (fanout)
              CUSTOMER_DELETED

Account Service (publisher — RPC)
    │
    └──► banking_queue ──► Customer Service (RPC responder)
              VALIDATE_CUSTOMER / GET_CUSTOMER_DETAILS
```

### Message Pattern Reference

| Constant | String Value | Publisher | Consumer | Type |
|----------|-------------|-----------|----------|------|
| `USER_CREATED` | `user.created` | Auth | Account, Customer | Event |
| `CUSTOMER_DELETED` | `customer.deleted` | Customer | Account | Event |
| `VALIDATE_CUSTOMER` | `customer.verify` | Account | Customer | RPC |
| `GET_CUSTOMER_DETAILS` | `customer.get` | Account | Customer | RPC |

---

## End-to-End Happy Path (Register → Add Money)

```
Step 1 — Register
  POST /auth/register  { email, password }
      └─► User saved in auth DB
      └─► USER_CREATED event emitted
              ├─ account_queue → Account service creates checking account (balance $0)
              └─ banking_queue → Customer service creates KYC profile

Step 2 — Login
  POST /auth/login  { email, password }
      └─► Session created in Redis
      └─► banking_session cookie set on client

Step 3 — Browse (any protected route)
  GET /customer
      └─► NGINX calls GET /auth/validate (cookie check)
      └─► 200 + X-User-ID injected → request forwarded to customer service

Step 4 — Add Money
  POST /account/:accountId/add  { amount: 500, customerId: "..." }
      └─► NGINX auth check passes
      └─► Account service calls RPC: customer.verify { id: customerId }
      └─► Customer service returns true
      └─► Balance updated in account DB
```

---

## Public Routes (no session cookie required)

| Route | Service |
|-------|---------|
| `/public/auth/health` | Auth health check |
| `/public/auth/api/docs` | Auth Swagger UI |
| `/public/auth/api/docs-json` | Auth OpenAPI JSON |
| `/public/account/health` | Account health check |
| `/public/account/api/docs` | Account Swagger UI |
| `/public/account/api/docs-json` | Account OpenAPI JSON |
| `/public/customer/health` | Customer health check |
| `/public/customer/api/docs` | Customer Swagger UI |
| `/public/customer/api/docs-json` | Customer OpenAPI JSON |
