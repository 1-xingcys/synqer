# Synqer API

NestJS over Prisma and PostgreSQL. It serves the web app, runs both OAuth
flows, receives LINE webhooks and pushes messages back, and reads Google
Calendar.

## Modules

| Module | Responsibility |
| --- | --- |
| `auth/` | Google and LINE Login (authorization code + PKCE), the LIFF token exchange, session issuing, and `SessionAuthGuard`. |
| `users/` | Turning an OAuth identity into a `User`, and user lookup. |
| `events/core/` | Creating, reading, updating and soft-deleting an event; the caller's own event list. |
| `events/voting/` | Staged votes, and committing them. |
| `events/participation/` | Joining an event, the expected-participant list, who still hasn't voted. |
| `events/confirmation/` | The host picking the final slots — staged and committed the same way votes are. |
| `events/shared/` | What those four have in common: the event and time-slot repositories, plus the pure services (status, schedule, mapper, authorization, capabilities). |
| `line-bot/` | Webhook handling, group membership tracking, Flex messages, rich menu. |
| `google-calendar/` | Calendar OAuth — separate from login — reading busy times, and encrypting the stored tokens. |
| `prisma/`, `config/`, `common/` | Prisma client lifecycle, environment validation, time helpers. |

## Layering

Within a module the chain is controller → service → repository.

- **Controllers** do HTTP and nothing else: DTOs and the global
  `ValidationPipe` for input, `SessionAuthGuard` and `@CurrentUser()` for
  identity, and the `@nestjs/swagger` decorators that become `openapi.json`.
- **Services** hold the rules. The pure ones — `event-status`,
  `event-schedule`, `time-slot`, `event-mapper`, `common/time` — never touch
  the database, which is what makes them cheap to unit test.
- **Repositories** are the only place Prisma is called.

Event status is a good example of the split: `VOTING`, `VOTING_ENDED`,
`CONFIRMED` and `COMPLETED` are not stored anywhere. `EventStatusService`
derives them from the voting deadline, the confirmed slots and the clock, so
there is no state to keep in sync.

## Authentication

- Google and LINE Login both run authorization code with PKCE. A callback
  upserts an `AuthIdentity` keyed by `(provider, providerUserId)`; an identity
  that has been seen before resolves to its existing `User`, a new one creates
  a `User` alongside it.
- Inside LINE, the LIFF page skips the redirect dance and posts its access
  token to `POST /auth/liff/login`, which verifies it with LINE and issues the
  same session.
- Sessions are rows in the `Session` table via `@quixo3/prisma-session-store`,
  behind an httpOnly `synqer.sid` cookie. [`src/main.ts`](src/main.ts) explains
  why the cookie's `sameSite` and `domain` differ between local development
  (one origin, behind nginx) and production (two subdomains, so every call is
  cross-site).

## Configuration

Every environment variable is declared and validated with Joi in
[`src/config/env.validation.ts`](src/config/env.validation.ts), so a missing or
malformed one fails at boot rather than on the first request that needs it.
Reading `process.env` anywhere else is rejected by CI — inject `ConfigService`
instead. [`.env.example`](.env.example) documents what each variable is for.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run start:dev` | Watch mode on `:8080`. |
| `npm run db:up` / `db:down` | The local Postgres from [`docker-compose.yml`](docker-compose.yml), on host port 5435. |
| `npm run db:pull` | Replace the local database with a dump of production. Needs `PROD_DATABASE_URL`. |
| `npm run openapi:generate` | Rebuild `openapi/openapi.json`. Run it after any controller or DTO change, then regenerate the frontend types. |
| `npm run reset-rich-menu` | Re-upload the LINE rich menu for your bot channel. |
| `npm test` / `npm run lint:ci` | Unit tests, lint. |
