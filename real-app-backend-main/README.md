# real app backend

## Home listing feeds (public)

These endpoints are public and intentionally mounted before auth middleware in
`routes/listingRoutes.js`.

### Highlighted home listings

```bash
curl "http://localhost:5000/api/v1/listings/home/highlighted?limit=9"
```

Example response:

```json
{
  "status": "success",
  "results": 3,
  "data": [
    {
      "_id": "67b1...",
      "name": "51 Glenview",
      "location": "Harare",
      "monthlyRent": 550,
      "createdAt": "2026-02-09T10:24:15.017Z"
    }
  ]
}
```

### Grouped by location for home slider

```bash
curl "http://localhost:5000/api/v1/listings/home/grouped-by-location?locationsLimit=6&perLocation=6"
```

Example response:

```json
{
  "status": "success",
  "results": 2,
  "data": [
    {
      "location": "Harare",
      "listings": [
        {
          "_id": "67b2...",
          "name": "5 Waterfalls",
          "location": "Harare",
          "monthlyRent": 850,
          "bedrooms": 3,
          "amenities": { "solar": true, "borehole": true },
          "image": "https://...",
          "images": ["https://..."],
          "createdAt": "2026-02-10T07:12:31.004Z"
        }
      ]
    }
  ]
}
```

### Lightweight controller tests

Run:

```bash
npm run test:home-feeds
```

This validates the two home feed controller methods and their core query/pipeline
behavior with mocked model calls.

## Seeding via API

`npm run seed` now seeds through the backend HTTP API instead of connecting to
MongoDB directly. This keeps password hashing, auth, and listing validation on
the normal application path.

Use a local backend by default:

```bash
npm run seed
```

Or seed a deployed backend explicitly:

```bash
SEED_API_BASE=https://your-backend-url.amplifyapp.com npm run seed
```

The script is idempotent for reruns. It logs in existing demo users when
possible, recreates any missing ones, and skips listing creation for landlords
who already have an active listing.

## Seeding directly with Prisma

Keep the API-based flow with:

```bash
npm run seed
```

Or seed the database directly using `DATABASE_URL` from `real-app-backend-main/.env`:

```bash
npm run seed:db
```

This bypasses the HTTP API and writes demo data straight through Prisma into the
configured PostgreSQL database.
