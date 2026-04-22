# Backend Profiles Persistence API - hng-stage-1(i14)

Backend service for the HNG Stage 1 assessment. It accepts a name, calls Genderize, Agify, and Nationalize, applies the required classification rules, persists profiles, and exposes REST endpoints for create, read, list, and delete operations.

## Stack

- Node.js + TypeScript
- Express.js
- Prisma ORM + PostgreSQL (Supabase)
- CORS, Helmet, Morgan, and rate limiting

## Base URL

Default local base URL:

http://localhost:4000

## Health and Root

- `GET /` - Root metadata endpoint
- `GET /api/v1/health` - Service health endpoint

## API Endpoints

### `POST /api/profiles`

Creates a profile from the provided name and stores the enriched result.

Request body:

```json
{ "name": "ella" }
```

Behavior:

- Returns `201` for newly created profiles
- Returns `200` + `"Profile already exists"` message for duplicate names (idempotent behavior)

### `GET /api/profiles/{id}`

Returns a single stored profile by ID.

### `GET /api/profiles`

Lists stored profiles and supports case-insensitive filtering by `gender`, `country_id`, and `age_group`.

Examples:

- `/api/profiles?gender=male`
- `/api/profiles?country_id=ng`
- `/api/profiles?age_group=adult`
- `/api/profiles?gender=male&country_id=ng`

### `DELETE /api/profiles/{id}`

Deletes a stored profile.

Returns `204 No Content` on success.

## Response Shape

Success responses use the `success` status and return a `data` payload. List responses also include `count`. Errors use the `error` status and a human-readable `message`.

Error format:

```json
{ "status": "error", "message": "<message>" }
```

## External APIs

- Genderize: `https://api.genderize.io?name={name}`
- Agify: `https://api.agify.io?name={name}`
- Nationalize: `https://api.nationalize.io?name={name}`

## Validation and Rules

- Age group mapping is derived from Agify age ranges
- Nationality is selected from the highest Nationalize probability
- Duplicate names should return the existing stored profile
- Invalid upstream payloads should return `502` and avoid persistence
- Invalid `name` type should return `422`
- Missing/empty `name` should return `400`
- Unknown profile id should return `404`
- All timestamps must be UTC ISO 8601
- All IDs must be UUID v7
- CORS must allow `*`

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create your environment file and set database credentials:

```bash
cp .env.example .env
```

If `cp` is unavailable in your shell, create `.env` manually.

## Running the Application

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

## Available Scripts

- `npm run dev` - Start the development server with hot reload
- `npm run build` - Compile the TypeScript project
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run format` - Format source files with Prettier
- `npm run check-format` - Verify formatting without writing changes

## Environment Variables

| Variable       | Description                                                     | Default       |
| -------------- | --------------------------------------------------------------- | ------------- |
| `PORT`         | Server port                                                     | `4000`        |
| `NODE_ENV`     | Runtime environment                                             | `development` |
| `DATABASE_URL` | Runtime DB connection string (recommended: pooled Supabase URL) | -             |
| `DIRECT_URL`   | Direct DB connection string for Prisma migrate commands         | -             |

## Migration Commands

```bash
npx prisma migrate dev
npx prisma migrate deploy
npx prisma migrate status
```

## Project Notes

This repository started from a backend scaffold and is being adapted for the Stage 1 profile persistence assessment.
