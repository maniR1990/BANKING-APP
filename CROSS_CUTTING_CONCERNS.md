# Cross-Cutting Concerns in Microservices Architecture

This document provides a Principal Architect's perspective on addressing cross-cutting concerns within the current NestJS/Nx monorepo ecosystem. It outlines the strategy, recommended modern tooling, and high-level architectural decisions required for a robust, enterprise-grade system.


## Current Implementation Status (Updated)

This section tracks the progress of the cross-cutting concerns outlined in this document against the current repository state.

### ✅ Fully Implemented
- **Structured Logging:** Centralized `AppLoggerModule` using `nestjs-pino` is fully implemented in the `libs/common` shared library and applied across the `auth`, `account`, and `customer` microservices.
- **Context Propagation & Distributed Tracing:** OpenTelemetry (`@opentelemetry/api`) is integrated into the logging configuration to inject `traceId` context.
- **Global Error Boundaries:** A robust `GlobalExceptionFilter` mapping HTTP/REST and GraphQL exceptions to RFC 7807 (`ProblemDetails`) is implemented in `libs/common` and applied globally in all bootstrapped apps.
- **Data Validation (Security):** `class-validator` and `ValidationPipe` are strictly enforced across all controllers via global pipes (stripping extra fields).
- **Basic Perimeter Defense:** Nginx API Gateway is set up with basic Rate Limiting (`limit_req_zone`) for authentication endpoints. Gateway validates sessions via the auth service before forwarding requests (`auth_request` pattern).

### 🚧 Partially Implemented / In Progress
- **Scalability & Orchestration:** Currently utilizing Docker Compose. Migration paths to Kubernetes are documented (`KUBERNETES_MIGRATION.md`), but native K8s manifests/Helm charts and HPA are not actively deployed or entirely shifted away from Docker Compose yet.
- **Identity and Access Management (IAM):** Trust is successfully shifted to the Nginx gateway, which forwards `X-User-ID`. However, sessions still use stateful HTTP-only cookies backed by Redis, rather than the proposed stateless JWT/OAuth2 flows.

### ❌ Remaining / Not Started
- **Application-Level Defense (Security Headers):** The `helmet` middleware, which sets secure HTTP headers (e.g., CSP, HSTS, X-Frame-Options), is not yet installed or injected into the NestJS applications.
- **Application-Level Rate Limiting:** While Nginx provides perimeter throttling, `@nestjs/throttler` is not yet configured for internal service-level rate limiting or complex bursting.
- **Service-to-Service Security (mTLS):** Internal traffic between microservices is not cryptographically authenticated via a Service Mesh (e.g., Istio/Linkerd).
- **Caching & Database Replicas:** Distributed in-memory caching (e.g., Redis for generic resolver outputs/REST payloads) and database read replicas with connection pooling (PgBouncer) remain theoretical.
- **Advanced Observability Stack:** The underlying applications are instrumented to emit telemetry, but the self-hosted APM platforms (LGTM Stack) or SaaS targets are not actively receiving or visualizing the data in standard environment deployment.

---

## 1. Logging and Tracing

In a distributed microservices environment, observing the behavior of requests as they traverse multiple boundaries is critical for debugging, performance tuning, and incident response. The goal is to achieve 100% observability through structured logging and distributed tracing.

### Strategy
*   **Structured Logging:** All logs must be output in a machine-readable format (JSON). This ensures that log aggregators can parse, index, and query log data efficiently without relying on fragile regex parsing.
*   **Context Propagation:** Every incoming request at the API Gateway must be assigned a unique Correlation ID (e.g., `X-Correlation-ID` or W3C Trace Context). This ID must be injected into all subsequent downstream HTTP calls, message broker events, and database queries.
*   **Centralized Aggregation:** Logs and traces must not be siloed on individual container file systems. They must be shipped asynchronously to a centralized observability platform.

### Recommended Modern Tools
*   **Logging Library (Application Level):** **Pino**. It is the industry standard for high-performance, low-overhead structured JSON logging in Node.js/NestJS.
*   **Distributed Tracing (Instrumentation):** **OpenTelemetry (OTel)**. OpenTelemetry provides a vendor-agnostic standard for instrumenting, generating, collecting, and exporting telemetry data (metrics, logs, and traces).
*   **Telemetry Backend / APM:**
    *   *Self-Hosted / Open Source:* **Grafana LGTM Stack** (Loki for logs, Grafana for visualization, Tempo/Jaeger for traces, Mimir/Prometheus for metrics).
    *   *SaaS / Enterprise:* **Datadog**, **New Relic**, or **Dynatrace**. These platforms natively ingest OTel data and provide advanced AI-driven anomaly detection out of the box.

---

## 2. Exception Handling

Handling exceptions gracefully and consistently across all microservices is essential for maintaining a reliable API contract with clients (frontend/mobile) and for preventing internal system state corruption.

### Strategy
*   **Global Error Boundaries:** Applications must not crash due to unhandled promise rejections or unexpected runtime errors. A global catch-all mechanism must be implemented at the highest level of the application request lifecycle.
*   **Standardized API Responses:** Clients must receive a uniform error structure regardless of which microservice generated the error. We recommend adopting **RFC 7807 (Problem Details for HTTP APIs)**. This standardizes error responses with fields like `type`, `title`, `status`, `detail`, and `instance`.
*   **Separation of Internal vs. External Errors:**
    *   *Client Errors (4xx):* Validation failures or missing resources should return detailed, actionable messages to the client.
    *   *Server Errors (5xx):* Internal exceptions (e.g., Database connection failures, null pointer exceptions) must be sanitized. The client should receive a generic "Internal Server Error" with a Trace ID, while the full stack trace and context are logged internally to the observability platform.

### Implementation Details (NestJS)
A `GlobalExceptionFilter` has been fully implemented in the shared `libs/common` module alongside a foundational `AppLoggerModule` utilizing `nestjs-pino` and OpenTelemetry (`@opentelemetry/api`).

**Key Features of the Configuration:**
1.  **Shared Nx Library (`libs/common`):** Eliminates code duplication by centralizing the `GlobalExceptionFilter` and `AppLoggerModule`.
2.  **Context-Aware Routing:** The filter automatically detects if a request is HTTP (REST) or GraphQL.
    *   **HTTP:** Maps errors to the RFC 7807 `ProblemDetails` standard (`type`, `title`, `status`, `detail`, `instance`, `traceId`). Masks internal 5xx details from the client while exposing validation (4xx) details.
    *   **GraphQL:** Intercepts the error purely to log it internally with the Trace ID, then re-throws it to allow Apollo Server's native error formatting to dictate the client response.
3.  **Trace ID Injection:** Extracts the active `traceId` via `@opentelemetry/api` (`trace.getActiveSpan()`). If no trace is active (e.g., OTel SDK is not fully bootstrapped yet), it falls back to generating a UUID.
4.  **Structured JSON Logging:** Uses Pino to log the raw exception (with full stack trace), request context, and the `traceId`.

### How to Debug Errors Using Trace IDs
Once the full LGTM (Loki, Grafana, Tempo, Mimir) stack is deployed, diagnosing a 500 Internal Server Error reported by a user follows this exact workflow:

1.  **User Reports Error:** A client experiences an error. The API response (following RFC 7807) looks like this:
    ```json
    {
      "type": "https://httpstatuses.com/500",
      "title": "Internal Server Error",
      "status": 500,
      "detail": "An unexpected error occurred. Please contact support.",
      "instance": "/api/account/transfer",
      "traceId": "d4cda95b652f4a1592b449d5929fda1b"
    }
    ```
2.  **Open Grafana:** The support engineer/developer logs into Grafana.
3.  **Search Logs in Loki:** Navigate to the "Explore" tab, select the Loki data source, and query by the provided Trace ID:
    `{container=~".*"} | json | traceId="d4cda95b652f4a1592b449d5929fda1b"`
4.  **Identify the Root Cause:** Loki will display the exact JSON log entry generated by the `GlobalExceptionFilter`. This log contains the **raw error stack trace** (e.g., `TypeORMError: relation "accounts" does not exist`) which was explicitly hidden from the client.
5.  **Distributed Tracing via Tempo:** Next to the `traceId` in the Grafana log line, click the automatically generated **Tempo button**. Grafana switches to the Tempo data source and visually maps the request's journey (NGINX -> Auth Service -> Account Service -> DB), highlighting exactly which span caused the latency or failure.

---

## 3. Scalability

The current architecture utilizes Docker Compose, which is suitable for local development and simple single-node deployments but lacks the resilience and automated scaling required for production workloads.

### Scalability Strategies and Use Cases
1.  **Horizontal Pod Autoscaling (HPA):**
    *   *Use Case:* Traffic spikes (e.g., sudden increase in user logins to the Auth service).
    *   *Reasoning:* Scaling out (adding more instances of a stateless microservice) is generally preferred over scaling up (adding more CPU/RAM to a single instance) as it increases fault tolerance and distributed throughput.
2.  **Database Read Replicas & Connection Pooling:**
    *   *Use Case:* High volume of read-heavy operations in the Customer or Account services.
    *   *Reasoning:* Offloading `SELECT` queries to read replicas prevents the primary PostgreSQL instance from becoming a bottleneck. Tools like **PgBouncer** should be used to manage connection limits from the numerous horizontally scaled application pods.
3.  **Caching (Distributed & In-Memory):**
    *   *Use Case:* Frequent retrieval of immutable or slow-changing data.
    *   *Reasoning:* Implementing Redis for caching complex GraphQL resolver outputs or REST responses drastically reduces database load and latency.

### Migration from Docker Compose to Kubernetes (K8s)
To achieve true enterprise scalability, the orchestration layer must transition to Kubernetes.

**High-Level Steps to Kubernetes:**
1.  **Container Registry:** Publish the Docker images currently built locally to a centralized registry (e.g., AWS ECR, GitHub Container Registry).
2.  **Manifests/Helm Charts:** Translate `docker-compose.yml` configurations into Kubernetes manifests (Deployments, Services, ConfigMaps, Secrets) or package them using **Helm**.
3.  **API Gateway / Ingress:** Replace the Docker NGINX setup with a K8s **Ingress Controller** (e.g., NGINX Ingress, or an advanced gateway like Kong/Apisix installed via Helm).
4.  **Stateful Workloads:** Migrate PostgreSQL and Redis out of containerized orchestration into managed cloud services (e.g., AWS RDS, AWS ElastiCache) for better durability, backups, and scalability.
5.  **Service Discovery & Mesh:** Rely on native K8s DNS (CoreDNS) for internal service-to-service communication. For advanced traffic routing, mTLS, and observability, consider introducing a Service Mesh like **Istio** or **Linkerd**.
6.  **Autoscaling:** Configure the Metrics Server and define Horizontal Pod Autoscalers (HPA) targeting CPU/Memory utilization thresholds for the NestJS deployments.

---

## 4. Security

Security in a microservices architecture must follow the principle of **Zero Trust**. The perimeter defense provided by the API Gateway is not sufficient; internal service-to-service communication must also be secured.

### High-Level Security Posture (Design Only)
*   **API Gateway as the Perimeter:**
    *   Implement strict Rate Limiting and Throttling to prevent DDoS attacks.
    *   Terminate SSL/TLS at the Gateway or Ingress layer.
    *   Implement Web Application Firewall (WAF) rules to block common OWASP Top 10 vulnerabilities (SQLi, XSS).
*   **Identity and Access Management (IAM):**
    *   Migrate from simple stateful sessions to stateless, short-lived **JWT (JSON Web Tokens)** or **OAuth2/OIDC** flows.
    *   The API Gateway should validate the signature of the access token before forwarding the request to downstream services. Downstream services should independently verify the token's claims (Role-Based Access Control - RBAC).
*   **Service-to-Service Security:**
    *   Implement **mTLS (Mutual TLS)** for all internal traffic between microservices to ensure data in transit is encrypted and services are cryptographically authenticated to one another. (Typically achieved via a Service Mesh).
*   **Application-Level Defense:**
    *   Sanitize all inputs (using tools like `class-validator`).
    *   Ensure secure HTTP headers (using Helmet.js conceptually) are injected into all responses.
    *   Manage secrets (DB credentials, API keys) securely using external secret managers (e.g., HashiCorp Vault, AWS Secrets Manager) injected dynamically at runtime, rather than hardcoding or using static `.env` files.
