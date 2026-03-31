# Migrating to Kubernetes (Service Discovery & API Gateway)

This guide provides step-by-step instructions on migrating your current Docker Compose microservices architecture to Kubernetes. Specifically, it addresses how Kubernetes natively handles **Service Discovery** and **API Gateways**.

As requested, this guide uses **Docker Desktop Kubernetes** for local testing and includes the actual YAML code you need to get started.

---

## 1. Why Kubernetes? (Addressing the Missing Pieces)

According to `ARCHITECTURE.md`, your current setup lacks proper **Service Discovery** and relies on a hardcoded NGINX `docker-compose.yml` setup for an **API Gateway**.

Kubernetes solves both out of the box:

*   **Service Discovery (Native):** You don't need external tools like Consul or Eureka. Kubernetes has built-in DNS (CoreDNS). When you create a `Service` in Kubernetes, it automatically gets a DNS name (e.g., `http://banking-auth-service:3000`) that other pods can use to communicate, regardless of how many instances are running.
*   **API Gateway (Ingress):** Instead of a custom NGINX container, Kubernetes uses an **Ingress Controller** (which is often backed by NGINX). It acts as the single entry point for external traffic and routes it to the appropriate internal `Services` based on the URL path.

---

## 2. Prerequisites (Docker Desktop Setup)

Since you are using Docker Desktop, enabling Kubernetes is very simple:

1.  Open **Docker Desktop**.
2.  Go to **Settings** (the gear icon).
3.  Click on **Kubernetes** in the left sidebar.
4.  Check the box for **"Enable Kubernetes"**.
5.  Click **Apply & Restart**. (This will download the necessary K8s components and start a local single-node cluster).
6.  Once the status says "Kubernetes is running", open your terminal and type:
    ```bash
    kubectl get nodes
    ```
    You should see one node named `docker-desktop` in the `Ready` status.

---

## 3. The Kubernetes Concepts You Need to Know

Before writing code, here are the three main building blocks we will use:

1.  **Deployment (`Deployment`):** This tells Kubernetes how to run your application (e.g., "Run 3 copies of my Auth service container"). It handles self-healing (restarting crashed containers).
2.  **Service (`Service`):** This is the **Service Discovery** part. It provides a stable IP address and DNS name (like `http://banking-auth-service:3000`) for the pods managed by your Deployment.
3.  **Ingress (`Ingress`):** This is your **API Gateway**. It manages external access to the `Services` in your cluster, typically via HTTP/HTTPS.

---

## 4. Writing the Kubernetes Manifests (YAML Code)

In Kubernetes, configuration is written in declarative YAML files called "manifests". Let's translate your current architecture into Kubernetes YAML.

Create a folder called `k8s/` in the root of your project to store these files.

### Step 4.1: The Databases (Redis & Postgres)

First, we need to get the databases running. While in production you'd use managed services (like AWS RDS), for local K8s, we can run them as simple pods.

Create a file `k8s/databases.yaml`:

```yaml
# PostgreSQL Deployment & Service
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_USER
          value: "postgres"
        - name: POSTGRES_PASSWORD
          value: "postgres"
        ports:
        - containerPort: 5432
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service # Other pods use this DNS name to connect!
spec:
  selector:
    app: postgres
  ports:
    - protocol: TCP
      port: 5432
      targetPort: 5432

---
# Redis Deployment & Service
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:alpine
        ports:
        - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service # Other pods use this DNS name to connect!
spec:
  selector:
    app: redis
  ports:
    - protocol: TCP
      port: 6379
      targetPort: 6379
```

### Step 4.2: The Microservices (Auth, Customer, Account)

Now, let's create the deployments for your NestJS apps. Note that you first need to build your Docker images locally (e.g., `docker build -t banking-auth:latest -f apps/auth/Dockerfile .`).

Create a file `k8s/microservices.yaml`:

```yaml
# ---------------- AUTH SERVICE ----------------
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-deployment
spec:
  replicas: 2 # Let's run 2 instances for high availability!
  selector:
    matchLabels:
      app: auth
  template:
    metadata:
      labels:
        app: auth
    spec:
      containers:
      - name: auth
        image: banking-auth:latest # Ensure you built this image locally
        imagePullPolicy: Never # Use local Docker Desktop images
        env:
        - name: REDIS_HOST
          value: "redis-service" # Connecting via K8s Service Discovery
        - name: DB_HOST
          value: "postgres-service" # Connecting via K8s Service Discovery
        ports:
        - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  selector:
    app: auth
  ports:
    - protocol: TCP
      port: 3000
      targetPort: 3000

# ---------------- CUSTOMER SERVICE ----------------
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: customer-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: customer
  template:
    metadata:
      labels:
        app: customer
    spec:
      containers:
      - name: customer
        image: banking-customer:latest
        imagePullPolicy: Never
        env:
        - name: DB_HOST
          value: "postgres-service"
        ports:
        - containerPort: 3002
---
apiVersion: v1
kind: Service
metadata:
  name: customer-service
spec:
  selector:
    app: customer
  ports:
    - protocol: TCP
      port: 3002
      targetPort: 3002

# ---------------- ACCOUNT SERVICE ----------------
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: account-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: account
  template:
    metadata:
      labels:
        app: account
    spec:
      containers:
      - name: account
        image: banking-account:latest
        imagePullPolicy: Never
        env:
        - name: DB_HOST
          value: "postgres-service"
        ports:
        - containerPort: 3001
---
apiVersion: v1
kind: Service
metadata:
  name: account-service
spec:
  selector:
    app: account
  ports:
    - protocol: TCP
      port: 3001
      targetPort: 3001
```

### Step 4.3: The API Gateway (Ingress)

To replace your `nginx.conf`, we use an **Ingress Controller**.

First, you must enable the NGINX Ingress Controller in Docker Desktop. Run this in your terminal:
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
```

Now, define your routing rules. Create `k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: banking-api-gateway
  annotations:
    # Use the NGINX ingress controller we just installed
    kubernetes.io/ingress.class: "nginx"

    # Enable rewrite to strip prefixes if necessary, or pass them down
    nginx.ingress.kubernetes.io/use-regex: "true"

    # Rate limiting (translating your nginx.conf limit_req)
    nginx.ingress.kubernetes.io/limit-rps: "5"
    nginx.ingress.kubernetes.io/limit-burst-multiplier: "2" # burst of 10

    # Custom configuration snippet to handle the internal-auth-validate logic
    nginx.ingress.kubernetes.io/server-snippet: |
      location = /internal-auth-validate {
          internal;
          # We use the internal K8s DNS name for the auth service
          proxy_pass http://auth-service.default.svc.cluster.local:3000/auth/validate;
          proxy_pass_request_body off;
          proxy_set_header Content-Length "";
          proxy_set_header X-Original-URI $request_uri;
      }

    # Apply the auth check to specific paths via auth-url annotation
    nginx.ingress.kubernetes.io/auth-url: "http://auth-service.default.svc.cluster.local:3000/auth/validate"
    nginx.ingress.kubernetes.io/auth-response-headers: "X-User-ID"

spec:
  rules:
  - host: localhost # You will test via http://localhost
    http:
      paths:
      # --- AUTH ENDPOINTS (Public) ---
      # We disable auth-url for these specific paths by making them exact matches
      # Ingress normally inherits annotations, but we handle auth in the app for login/register
      - path: /auth/login
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 3000
      - path: /auth/register
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 3000

      # --- PROTECTED ENDPOINTS ---
      - path: /customer(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: customer-service
            port:
              number: 3002
      - path: /account(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: account-service
            port:
              number: 3001
```

*(Note: Ingress annotations can be complex when translating custom `nginx.conf` auth_request blocks. The above demonstrates the K8s equivalent of using Nginx Ingress annotations for external auth.)*

---

## 5. Applying the Configuration

Now that you have your YAML files, it's time to tell Kubernetes to create everything.

1.  Make sure your Docker images are built locally first:
    ```bash
    docker build -t banking-auth:latest -f apps/auth/Dockerfile .
    docker build -t banking-customer:latest -f apps/customer/Dockerfile .
    docker build -t banking-account:latest -f apps/account/Dockerfile .
    ```

2.  Apply the databases:
    ```bash
    kubectl apply -f k8s/databases.yaml
    ```

3.  Apply the microservices:
    ```bash
    kubectl apply -f k8s/microservices.yaml
    ```

4.  Apply the Ingress (Gateway):
    ```bash
    kubectl apply -f k8s/ingress.yaml
    ```

---

## 6. Verifying It Works

1.  **Check your Pods:** Ensure all containers are running successfully.
    ```bash
    kubectl get pods
    ```
    You should see status `Running` for postgres, redis, auth, account, and customer pods.

2.  **Check your Services:** Ensure the internal DNS records (Service Discovery) are set up.
    ```bash
    kubectl get services
    ```

3.  **Check your Ingress:** Ensure the API Gateway has successfully acquired an address.
    ```bash
    kubectl get ingress
    ```

4.  **Test the API:** Open Postman or your browser and try hitting the API Gateway just like you did with Docker Compose:
    *   `http://localhost/auth/health`
    *   `http://localhost/account/api/health`

## Summary of Changes

*   **Service Discovery:** Handled natively by Kubernetes `Service` objects (e.g., `redis-service`, `postgres-service`). Apps connect via these internal DNS names rather than IP addresses.
*   **API Gateway:** Handled by the **NGINX Ingress Controller**, which translates routing rules and auth-guards (`auth-url`) defined in `ingress.yaml` into routing logic at the edge of the cluster.
