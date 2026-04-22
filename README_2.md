# Backend Intelligence Query API - hng-stage-2(i14)

Backend service for the HNG Stage 2 assessment. It supports advanced filtering, sorting, pagination, and a rule-based natural language query endpoint over demographic profiles.

## Stack

- Node.js + TypeScript
- Express.js
- Prisma ORM + PostgreSQL (Supabase-compatible)
- CORS, Helmet, Morgan, and rate limiting

## Base URL

Default local base URL:

http://localhost:4000

## Health and Root

- `GET /` - Root metadata endpoint
- `GET /api/v1/health` - Service health endpoint

## API Endpoints

### `POST /api/profiles`

Creates a Stage 2 profile from the provided name using Genderize, Agify, and Nationalize.

Request body:

```json
{ "name": "ella" }
```

Behavior:

- Returns `201` for newly created profiles
- Returns `200` + `"Profile already exists"` when the name already exists

### `GET /api/profiles/{id}`

Returns a single stored profile by ID.

### `GET /api/profiles`

Returns only Stage 2 seeded dataset profiles (`dataset=v2`) with combinable filters and sorting.

Supported filters:

- `gender`
- `age_group`
- `country_id`
- `min_age`
- `max_age`
- `min_gender_probability`
- `min_country_probability`

Sorting:

- `sort_by`: `age` | `created_at` | `gender_probability`
- `order`: `asc` | `desc`

Pagination:

- `page` (default `1`)
- `limit` (default `10`, max `50`)

Example:

- `/api/profiles?gender=male&country_id=NG&min_age=25&sort_by=age&order=desc&page=1&limit=10`

Success response shape:

```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 2026,
  "data": []
}
```

### `GET /api/profiles/search`

Rule-based natural language query parser that maps plain English into profile filters.

Query params:

- `q` (required)
- `page` (optional, default `1`)
- `limit` (optional, default `10`, max `50`)

Example:

- `/api/profiles/search?q=young males from nigeria&page=1&limit=10`

If query cannot be interpreted:

```json
{ "status": "error", "message": "Unable to interpret query" }
```

### `DELETE /api/profiles/{id}`

Deletes a stored profile and returns `204 No Content`.

## Natural Language Parsing Approach

The parser is rule-based (no AI/LLM) and uses deterministic keyword matching:

- Gender terms:
  - `"male"`, `"males"` -> `gender=male`
  - `"female"`, `"females"` -> `gender=female`
- Age group terms:
  - `"child"`/`"children"` -> `age_group=child`
  - `"teen"`/`"teenager"` variants -> `age_group=teenager`
  - `"adult"`/`"adults"` -> `age_group=adult`
  - `"senior"`/`"seniors"` -> `age_group=senior`
- Special age keyword:
  - `"young"` -> `min_age=16`, `max_age=24`
- Numeric age bounds:
  - `"above 30"`, `"over 30"`, `"older than 30"`, `"30+"` -> `min_age=30`
  - `"below 20"`, `"under 20"` -> `max_age=20`
- Country extraction:
  - `"from nigeria"` and country-name mentions map to ISO-2 `country_id` using built-in region mapping.

Parsed filters are forwarded to the same `/api/profiles` filter engine.

## V1 Compatibility

V1 records are isolated under `/api/v1/profiles` (`dataset=v1`):

- `POST /api/v1/profiles`
- `GET /api/v1/profiles`
- `GET /api/v1/profiles/search`
- `GET /api/v1/profiles/{id}`
- `DELETE /api/v1/profiles/{id}`

This allows `/api/profiles` to stay dedicated to the 2026 Stage 2 dataset.

## Limitations

- Does not support deeply complex grammar (e.g., multi-clause comparative logic).
- If both male and female are present in the same query, gender filter is skipped.
- Country extraction is keyword-based and may miss uncommon aliases/slang.
- Does not parse probability constraints from natural language (e.g., "high confidence").

## Response Shape

Success responses use `status: "success"`.  
Error responses use:

```json
{ "status": "error", "message": "<message>" }
```

Notable error cases:

- `400` - missing/empty required parameter (e.g. missing `q`)
- `422` - invalid query parameter types/values (`"Invalid query parameters"`)
- `404` - profile not found
- `500`/`502` - internal/upstream server failures

## Data Model (Profiles)

The `profiles` table contains:

- `id` (UUID v7)
- `name` (unique)
- `gender`
- `gender_probability`
- `age`
- `age_group` (`child`, `teenager`, `adult`, `senior`)
- `country_id` (ISO-2)
- `country_name`
- `country_probability`
- `created_at` (UTC ISO 8601 in API responses)

## Data Seeding (2026 Profiles)

Seed file location:

- `src/data/seed_profiles.json`

Seed command:

```bash
npm run seed
```

Behavior:

- Upserts by unique `name` (re-running does not create duplicates)
- Normalizes stored names to lowercase
- Ensures `country_id` is uppercase ISO-2
- Uses existing UUID v7 when valid; otherwise generates UUID v7

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

If `cp` is unavailable in your shell, create `.env` manually.

3. Apply migrations:

```bash
npx prisma migrate dev
```

4. Seed database:

```bash
npm run seed
```

5. Start development server:

```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Run production build
- `npm run seed` - Seed Stage 2 profile dataset
- `npm run lint` - Run ESLint
- `npm run format` - Format source files
- `npm run check-format` - Validate formatting

## Environment Variables

| Variable       | Description                                 | Default       |
| -------------- | ------------------------------------------- | ------------- |
| `PORT`         | Server port                                 | `4000`        |
| `NODE_ENV`     | Runtime environment                         | `development` |
| `DATABASE_URL` | Runtime DB connection string                | -             |
| `DIRECT_URL`   | Direct DB URL for Prisma migration commands | -             |

## Migration Commands

```bash
npx prisma migrate dev
npx prisma migrate deploy
npx prisma migrate status
```
