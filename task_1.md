# Backend Wizards - Stage 1 Task: Data Persistence & API Design Assessment

Congratulations on passing Stage 0. Stage 1 is live.

This stage is different. You're not just calling APIs anymore. You're building a system that stores data, handles duplicates, and serves it back through your own API.

- Task details in Airtable: link
- Explainer video: [link](https://www.tiktok.com/@hnginternship/video/7628579390393240854)

## What It Should Do

Accept a name, call three external APIs, apply classification logic, store the result in a database, and expose endpoints to manage that data.

### The Three APIs (all free, no key required)

- Genderize API: `https://api.genderize.io?name={name}`
- Agify API: `https://api.agify.io?name={name}`
- Nationalize API: `https://api.nationalize.io?name={name}`

### Classification Rules

- Age group from Agify:
  - 0-12 -> `child`
  - 13-19 -> `teenager`
  - 20-59 -> `adult`
  - 60+ -> `senior`
- Nationality: pick the country with the highest probability from the Nationalize response.

## Endpoints To Build

### 1. Create Profile

`POST /api/profiles`

Request body:

```json
{ "name": "ella" }
```

Success response (`201 Created`):

```json
{
  "status": "success",
  "data": {
    "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
    "name": "ella",
    "gender": "female",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 46,
    "age_group": "adult",
    "country_id": "DRC",
    "country_probability": 0.85,
    "created_at": "2026-04-01T12:00:00Z"
  }
}
```

If the same name comes in again, do not create a new record. Return the existing one:

```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": { "...": "existing profile" }
}
```

### 2. Get Single Profile

`GET /api/profiles/{id}`

Success response (`200 OK`):

```json
{
  "status": "success",
  "data": {
    "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
    "name": "emmanuel",
    "gender": "male",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 25,
    "age_group": "adult",
    "country_id": "NG",
    "country_probability": 0.85,
    "created_at": "2026-04-01T12:00:00Z"
  }
}
```

### 3. Get All Profiles

`GET /api/profiles`

Optional query parameters:

- `gender`
- `country_id`
- `age_group`

Query parameter values are case-insensitive (e.g. `gender=Male` and `gender=male` are treated the same).

Example:

`/api/profiles?gender=male&country_id=NG`

Success response (`200 OK`):

```json
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "id": "id-1",
      "name": "emmanuel",
      "gender": "male",
      "age": 25,
      "age_group": "adult",
      "country_id": "NG"
    },
    {
      "id": "id-2",
      "name": "sarah",
      "gender": "female",
      "age": 28,
      "age_group": "adult",
      "country_id": "US"
    }
  ]
}
```

### 4. Delete Profile

`DELETE /api/profiles/{id}`

Returns `204 No Content` on success.

## Error Responses

All errors follow this structure:

```json
{ "status": "error", "message": "<error message>" }
```

- `400 Bad Request`: Missing or empty name
- `422 Unprocessable Entity`: Invalid type
- `404 Not Found`: Profile not found
- `500/502`: Upstream or server failure

### Edge Cases

- Genderize returns `gender: null` or `count: 0` -> return `502`, do not store
- Agify returns `age: null` -> return `502`, do not store
- Nationalize returns no country data -> return `502`, do not store

`502` error format:

```json
{ "status": "error", "message": "${externalApi} returned an invalid response" }
```

Error handling (external APIs):

```json
{ "status": "502", "message": "${externalApi} returned an invalid response" }
```

`externalApi = Genderize | Agify | Nationalize`

## Additional Requirements

- CORS header: `Access-Control-Allow-Origin: *`
  - Without this, the grading script cannot reach your server.
- All timestamps in UTC ISO 8601
- All IDs in UUID v7
- Response structure must match exactly. Grading is partially automated.

## Evaluation Criteria

- API Design (Endpoints): 15 pts
- Multi-API Integration: 15 pts
- Data Persistence: 20 pts
- Idempotency Handling: 15 pts
- Filtering Logic: 10 pts
- Data Modeling: 10 pts
- Error Handling: 10 pts
- Response Structure: 5 pts

**Total: 100 pts**

## Submission Instructions

- Any language works
- Render is not accepted. Vercel, Railway, Heroku, AWS, PXXL App, and similar platforms are fine
- The GitHub repo should include a clear README
- Test all endpoints before submitting

## Submission

1. Confirm your server is live. Test from multiple networks if you can.
2. Run `/submit` in `#stage-one-backend` and submit the requested URLs.
3. Submit:
   - Your API base URL (`https://yourapp.domain.app`)
   - Your GitHub repo link
4. Check Thanos bot for the error or success message after each attempt.

**Pass Mark:** 75/100  
**Submission Deadline:** Friday, 17th Apr 2026 | 11:59pm GMT+1 (WAT)

Good luck, Backend Wizards!
