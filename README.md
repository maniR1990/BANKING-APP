<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```
## Microservices Architecture & Runbook

This workspace contains three independent NestJS microservices managed inside an Nx monorepo.

Detailed documentation is now consolidated in the [docs/](./docs/) folder:
- **[Architecture & Design](./docs/ARCHITECTURE.md)**: High-level design, CI/CD diagrams, and service identification.
- **[Kubernetes Commands](./docs/KUBERNETES_COMMANDS.md)**: Cheat sheet for building, deploying, and monitoring.
- **[BFF Report](./docs/BFF_REPORT.md)**: Analysis of the Backend-for-Frontend pattern.
- **[Cross-Cutting Concerns](./docs/CROSS_CUTTING_CONCERNS.md)**: Logging, tracing, and security strategy.

### Core Architecture Components

1. **Monorepo & Nx**: Projects configured via `project.json`.
2. **API Gateway**: Handled by **NGINX Ingress Controller** in Kubernetes.
3. **Communication Patterns**:
   - **Synchronous**: REST/GraphQL over HTTP.
   - **Asynchronous**: Event-driven architecture using **RabbitMQ**.
4. **Service Discovery**: Native **Kubernetes CoreDNS**.
5. **Containerization**: production-ready **Dockerfiles** for all services.

### Quick Start (Kubernetes)

1. **Install packages**: `pnpm install`
2. **Build & Deploy**:
   ```bash
   # Build images
   docker build -t banking-app-auth-service:latest -f apps/auth/Dockerfile .
   docker build -t banking-app-account-service:latest -f apps/account/Dockerfile .
   docker build -t banking-app-customer-service:latest -f apps/customer/Dockerfile .

   # Apply manifests
   kubectl apply -f k8s/
   ```
3. **Port Forwarding**:
   - Database: `kubectl port-forward svc/banking-postgres 5433:5432`
   - RabbitMQ: `kubectl port-forward svc/rabbitmq-service 15672:15672`

### API Documentation & Testing
- **Postman**: Import `Banking_App_API_Collection.postman_collection.json` from the root.
- **Swagger**: Accessible at `http://localhost/public/<service>/api/docs` (e.g. `public/auth/api/docs`).

---

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
