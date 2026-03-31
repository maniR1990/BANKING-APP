# Kubernetes Commands Reference Guide

This document contains all the essential commands for building, deploying, and managing the Banking Application microservices in a Kubernetes environment (Docker Desktop).

---

## 1. Local Application Build (Nx)
Use these to statically compile the TypeScript code before building Docker images.

```bash
# Build all services at once
pnpm exec nx run-many --target=build --projects=auth,account,customer --prod --no-cloud

# Build individual services
pnpm exec nx build auth --prod
pnpm exec nx build account --prod
pnpm exec nx build customer --prod
```

---

## 2. Docker Image Build Commands
Build the Docker images locally. Kubernetes is configured to use these local images (`imagePullPolicy: Never`).

```bash
# Auth Service
docker build -t banking-app-auth-service:latest -f apps/auth/Dockerfile .

# Account Service
docker build -t banking-app-account-service:latest -f apps/account/Dockerfile .

# Customer Service
docker build -t banking-app-customer-service:latest -f apps/customer/Dockerfile .
```

---

## 3. Kubernetes Deployment Commands
Apply or update the Kubernetes manifests.

```bash
# Apply ALL configurations at once
kubectl apply -f k8s/

# Apply specific components
kubectl apply -f k8s/shared-config.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/rabbitmq.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/auth.yaml
kubectl apply -f k8s/account.yaml
kubectl apply -f k8s/customer.yaml
kubectl apply -f k8s/global-health.yaml
kubectl apply -f k8s/swagger-ui.yaml
```

---

## 4. Managing Deployments
Restart services to pick up new images or config changes.

```bash
# Restart services (Pick up new Docker images)
kubectl rollout restart deployment banking-auth
kubectl rollout restart deployment banking-account
kubectl rollout restart deployment banking-customer

# Check rollout status
kubectl rollout status deployment banking-auth

# Scale a service
kubectl scale deployment banking-auth --replicas=3
```

---

## 5. Monitoring and Troubleshooting
Commands to check the health of your cluster.

```bash
# List all resources
kubectl get all

# View Pods and their status
kubectl get pods

# Watch pods in real-time
kubectl get pods -w

# Describe a pod (useful for debugging "Pending" or "CrashLoopBackOff")
kubectl describe pod <pod-name>

# View ConfigMaps and Secrets
kubectl get configmap banking-shared-config -o yaml
kubectl get secret banking-db-secrets -o yaml
```

---

## 6. Viewing Logs
Essential for debugging event emission and database connectivity.

```bash
# Follow logs for a specific deployment
kubectl logs -f deployment/banking-auth
kubectl logs -f deployment/banking-account
kubectl logs -f deployment/banking-customer

# View logs for a specific pod instance
kubectl logs -f <pod-name>

# View logs for the RabbitMQ broker
kubectl logs -f deployment/banking-rabbitmq
```

---

## 7. Port Forwarding
Access internal cluster services from your local machine (DBeaver, Browser, etc.).

```bash
# PostgreSQL (DBeaver) - Access via localhost:5433
kubectl port-forward svc/banking-postgres 5433:5432

# RabbitMQ Management UI - Access via http://localhost:15672
kubectl port-forward svc/rabbitmq-service 15672:15672

# Redis - Access via localhost:6379
kubectl port-forward svc/banking-redis-service 6379:6379

# Auth Service directly (Bypass Ingress) - Access via localhost:3000
kubectl port-forward svc/banking-auth 3000:3000
```

---

## 8. Cleanup Commands
Remove resources from the cluster.

```bash
# Delete all resources defined in the k8s folder
kubectl delete -f k8s/

# Delete specific deployment
kubectl delete deployment banking-auth
```
