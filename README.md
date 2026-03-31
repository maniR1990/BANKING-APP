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

This workspace contains three independent NestJS microservices managed inside an Nx monorepo. Each service lives under `apps/` and is responsible for a specific bounded context:

- **account** – handles account-related operations.
- **auth** – authentication, user management, and health checks.
- **customer** – GraphQL resolver for customer data.

### Technical Overview

1. **Monorepo & Nx**
   - Projects configured via `project.json` files.
   - Common build/test/lint commands executed with `pnpm nx <target> <project>`.

2. **Framework & Patterns**
   - NestJS 11 with modules, controllers, services, and decorators.
   - Transport: HTTP/Express for controllers; Redis used for microservice health pings.
   - GraphQL in `customer` service using Apollo integration.

3. **Data & Persistence**
   - PostgreSQL accessed through TypeORM (`*.entity.ts` definitions).
   - Each service may define its own entities.

4. **Infrastructure (Kubernetes)**
   - Dockerfiles in each app.
   - Core infrastructure (Databases, API Gateway/Ingress, Microservices) is orchestrated using Kubernetes manifests located in the `k8s/` directory. (Docker Compose setup has been deprecated).
   - Health checks using `@nestjs/terminus` (see `auth/src/health/health.controller.ts`).

5. **Testing & Quality**
   - Jest for unit/e2e; example e2e suite in `customer`.
   - ESLint + Prettier config enforce style across workspace.

6. **Build & Dev**
   - Webpack configs for faster build iterations.
   - `start:dev`, `start:prod` and Nx commands available via package scripts.

### Dependencies

Runtime dependencies are declared at the workspace root. Key packages include:

- NestJS core modules: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/microservices`, `@nestjs/terminus`, `@nestjs/graphql`, `@nestjs/typeorm`, etc.
- Database: `typeorm`, `pg`.
- Caching/Queue: `ioredis`.
- Validation: `class-validator`, `class-transformer`.
- Utilities: `axios`, `bcrypt`, `uuid`, `rxjs`, etc.

Dev dependencies include Nx plugins, TypeScript tooling, Jest, ESLint, Prettier, and build helpers such as `ts-node`, `ts-jest` and `webpack-cli`.

### Installation & Running

1. **Install packages**:
   ```bash
   pnpm install
   ```

2. **Kubernetes environment (Docker Desktop):**
   Ensure Docker Desktop Kubernetes is enabled. First build the images, then apply the manifests:
   ```bash
   # Build the microservices locally
   pnpm nx run-many -t build
   docker build -t banking-auth:latest -f apps/auth/Dockerfile .
   docker build -t banking-customer:latest -f apps/customer/Dockerfile .
   docker build -t banking-account:latest -f apps/account/Dockerfile .

   # Apply manifests (Make sure Nginx Ingress is enabled on your cluster)
   kubectl apply -f k8s/
   ```
   Services are exposed via the Kubernetes Nginx Ingress on `localhost:80`.

3. **Local development**:
   ```bash
   pnpm run start:dev      # run current service with file watch
   pnpm nx serve account    # serve a specific project via Nx
   ```

4. **Testing**:
   ```bash
   pnpm nx test <project>
   pnpm nx e2e customer
   pnpm run test:cov
   ```

### Developer Notes

- Use `pnpm nx generate` to scaffold new modules/services or libraries.
- Shared logic should be extracted into `libs/` when duplication occurs.
- Keep `package.json` versions aligned to avoid mismatches.
- Extend health checks with additional indicators as the architecture grows.
- Leverage Nx affected commands for efficient CI.

---

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
