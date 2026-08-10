# Vels University Bus Tracker — Backend

Shared NestJS backend for the Student App, Driver App, and Admin Portal.

## Prerequisites

- Node.js 20+
- Docker and Docker Compose (for local Postgres + Redis)
- A Firebase project with a service account key (for push notifications)
- An S3-compatible bucket (AWS S3 or MinIO)

## Local Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start infrastructure

```bash
docker-compose up -d
```

### 4. Run migrations

```bash
npm run build
npm run migration:run
```

### 5. Seed the database

Creates the admin user, 12 routes, 12 chat rooms, and adds admin to all rooms.

```bash
npm run seed
```

### 6. Start the dev server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/v1`  
Swagger docs: `http://localhost:3000/docs`

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run seed` | Seed admin + routes + chat rooms |
| `npm run test` | Run unit tests |

## Architecture Overview

```
src/
  auth/           JWT + refresh token auth, role guards
  users/          User CRUD (admin), self-profile
  buses/          Bus management, assignment, reroute
  routes/         Route + stop CRUD
  rides/          Ride lifecycle (start/end), GPS trail
  gps/            Socket.io gateway (real-time GPS, chat events)
  chat/           Messages, attachments (S3), moderation
  notifications/  FCM push notifications, log
  audit/          Audit log (write + read)
  scheduler/      Cron jobs (cleanup, stale-ride recovery)
  common/         Redis service, S3 service, shared entities
  config/         Environment configuration
  database/       Migrations, seed script
  health/         Health check endpoint
```

## API Contract

See the [implementation plan](../docs/implementation_plan.md) for the full REST and Socket.io contract, or visit `/docs` when running in development mode.

## Environment Variables

See [.env.example](.env.example) for all required environment variables.

## Security

- JWT access tokens expire in 15 minutes. Refresh tokens expire in 7 days and are rotated on each use.
- All endpoints are rate-limited (see `.env.example` for limits).
- File uploads are validated server-side via magic bytes (not client-declared MIME type). Max 25 MB.
- Security headers (CSP, HSTS, X-Frame-Options) are set by Helmet on every response.
- CORS is restricted to configured origins in production.
- IDOR protection: any request for a resource the caller does not own returns a generic "Not authorized." — the server never confirms whether the resource exists.

## Scheduled Jobs

| Job | Schedule | Action |
|-----|----------|--------|
| attachment-cleanup | Daily 02:00 | Delete expired S3 attachments (30-day retention) |
| audit-log-cleanup | Daily 02:30 | Delete audit log rows older than 60 days |
| notification-log-cleanup | Daily 02:45 | Delete notification log rows older than 60 days |
| stale-ride-recovery | Every 30 min | Auto-end rides stuck in active state for > 2 hours |

All job runs are recorded in the `scheduled_job_log` table.
