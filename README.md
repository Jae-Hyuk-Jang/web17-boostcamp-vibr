# VIBR

A social music curation web app. Share a song recommendation with a short note, and the people who follow you can play it and react in the same place.

> This project is being reworked by a single maintainer. There is no live deployment, and the product name and direction are being redefined.

Originally started as a team project at Naver Boostcamp ([web17-Busy](https://github.com/boostcampwm2025/web17-Busy)).

## Tech stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, Zustand, TanStack Query
- **Backend**: NestJS, TypeORM, MySQL, Redis
- **Tooling**: TypeScript, pnpm workspaces, Turborepo, Jest, ESLint, Prettier, Husky
- **CI**: GitHub Actions

## Getting started

### Requirements

- Node.js 20.9 or later
- pnpm 9 (enable with `corepack enable`)
- Docker (for MySQL and Redis)

### Setup

```bash
corepack enable
pnpm install
cp apps/api/example.env apps/api/.env
cp apps/web/sample.env apps/web/.env
```

- Create a `.env` file in the repository root with `REDIS_PASSWORD`. Docker Compose starts Redis with it, so it must match `REDIS_PASSWORD` in `apps/api/.env`.
- Keys for Google OAuth, the YouTube Data API, and NCP Object Storage are described in the comments of each example file.

### Run

```bash
docker compose up -d   # MySQL on port 3307, Redis on port 6379
pnpm dto               # build the shared DTO package (rerun after changing DTOs)
pnpm dev               # web: http://localhost:3000, api: http://localhost:3002/api
```

## Scripts

| Command            | Description          |
| ------------------ | -------------------- |
| `pnpm lint`        | Lint all packages    |
| `pnpm check-types` | Type-check all apps  |
| `pnpm test`        | Run tests            |
| `pnpm build`       | Build all apps       |
| `pnpm format`      | Format with Prettier |
