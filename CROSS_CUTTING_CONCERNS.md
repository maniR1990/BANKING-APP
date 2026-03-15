# Cross-Cutting Concerns in Microservices Architecture

This document provides a Principal Architect's perspective on addressing cross-cutting concerns within the current NestJS/Nx monorepo ecosystem. It outlines the strategy, recommended modern tooling, and high-level architectural decisions required for a robust, enterprise-grade system.

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

### Implementing the Grafana LGTM Stack
The LGTM stack (Loki, Grafana, Tempo, Mimir) is the recommended open-source path for correlating logs, traces, and metrics.

**Step-by-Step Implementation:**

1. **Infrastructure Provisioning (Docker Compose/K8s):**
   * Add containers for Loki (log aggregation), Tempo (distributed tracing backend), Mimir/Prometheus (metrics), and Grafana (visualization UI) to your infrastructure definitions.
   * Add an **OpenTelemetry Collector (OTel Collector)** container. This acts as the central router: applications send telemetry here, and the Collector forwards logs to Loki, traces to Tempo, and metrics to Mimir.

2. **Application Instrumentation (NestJS):**
   * **Tracing:** Use the `@opentelemetry/sdk-node` and auto-instrumentation packages (e.g., `@opentelemetry/instrumentation-http`, `@opentelemetry/instrumentation-express`, `@opentelemetry/instrumentation-pg`). Configure the Node SDK to export traces to the OTel Collector endpoint (usually via OTLP over gRPC/HTTP).
   * **Logging:** Configure **Pino** to output structured JSON. Crucially, the Pino configuration must inject the `trace_id` and `span_id` provided by the current OpenTelemetry context into every log entry.
   * **Metrics:** Use `@willsoto/nestjs-prometheus` to expose a `/metrics` endpoint on each service, which Prometheus/Mimir will scrape, or push metrics directly via OTel.

3. **Log Shipping:**
   * Configure the Docker daemon logging driver to use `loki` (via the Loki Docker Driver plugin) or use a sidecar agent like **Promtail** to read the stdout of your NestJS containers and push the JSON logs to Loki.

4. **Grafana Configuration & Usage:**
   * **Data Sources:** In Grafana, configure Loki, Tempo, and Mimir as Data Sources.
   * **Derived Fields:** In the Loki data source settings, configure a "Derived Field" that parses the `trace_id` from the JSON logs and creates a direct internal link to the Tempo data source.
   * **Developer Workflow:**
     * A developer receives an alert or customer complaint.
     * They open Grafana and query **Loki** for the error log (e.g., `{app="customer-service"} |= "error"`).
     * Because logs contain the injected `trace_id`, Grafana displays a clickable button next to the log line.
     * Clicking the button seamlessly transitions the developer to **Tempo**, visualizing the entire distributed trace waterfall across the Gateway, Auth, and Customer services, instantly identifying which specific microservice request failed and caused the error.

---

## 2. Exception Handling

Handling exceptions gracefully and consistently across all microservices is essential for maintaining a reliable API contract with clients (frontend/mobile) and for preventing internal system state corruption.

### Strategy
*   **Global Error Boundaries:** Applications must not crash due to unhandled promise rejections or unexpected runtime errors. A global catch-all mechanism must be implemented at the highest level of the application request lifecycle.
*   **Standardized API Responses:** Clients must receive a uniform error structure regardless of which microservice generated the error. We recommend adopting **RFC 7807 (Problem Details for HTTP APIs)**. This standardizes error responses with fields like `type`, `title`, `status`, `detail`, and `instance`.
*   **Separation of Internal vs. External Errors:**
    *   *Client Errors (4xx):* Validation failures or missing resources should return detailed, actionable messages to the client.
    *   *Server Errors (5xx):* Internal exceptions (e.g., Database connection failures, null pointer exceptions) must be sanitized. The client should receive a generic "Internal Server Error" with a Trace ID, while the full stack trace and context are logged internally to the observability platform.

### Conceptual Implementation (NestJS)
*   Implement a **Global Exception Filter** in NestJS. This filter will intercept all `HttpException` and standard `Error` objects thrown during the request lifecycle.
*   The filter maps the internal error to the RFC 7807 format, logs the raw error via Pino (attaching the current OpenTelemetry Trace ID), and returns the sanitized HTTP response.

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
