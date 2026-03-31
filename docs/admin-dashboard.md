# Admin Dashboard — Local Reference

> Local only — this file is git-ignored (`/docs/` in the root `.gitignore`). Do not commit.

## What it does

The Admin Dashboard lets users with `role: "admin"` find expired (inactive) listings and bulk-revive them. Reviving a listing:

- Sets `status` → `"active"`
- Sets `publishedAt` → now
- Sets `paymentDeadline` → now + 48 hours
- Sends an email to the landlord (fire-and-forget — email failure does not block the response)

## Key files

| File | Purpose |
| --- | --- |
| `real-app-backend-main/routes/adminRoutes.js` | Route definitions |
| `real-app-backend-main/controllers/adminController.js` | Business logic |
| `real-app-backend-main/controllers/authController.js` | `protect` + `requireRole("admin")` |
| `real-app-backend-main/models/listingModel.js` | Listing schema |
| `real-app-backend-main/models/userModel.js` | User schema (role enum) |
| `real-app-backend-main/app.js` | Mounts admin router at `/api/v1/admin` |
| `real-app-backend-main/tests/adminController.test.js` | Unit tests |
| `real-app-frontend-main/src/views/Dashboard/Admin.tsx` | Admin UI component |
| `real-app-frontend-main/src/redux/api/adminApiSlice.ts` | RTK Query endpoints |
| `real-app-frontend-main/src/routes/ProtectedRoutes.tsx` | Role guard |
| `real-app-frontend-main/src/App.tsx` | Route wiring |

## API endpoints

All routes require `Authorization: Bearer <token>` with `role: "admin"`.

### GET /api/v1/admin/listings/inactive

Query params:

- `province` — partial match (case-insensitive regex)
- `city` — partial match (case-insensitive regex)
- `landlord` — matches username OR email (case-insensitive regex)
- `expiredFrom` / `expiredTo` — filters on `paymentDeadline` field
- `uploadedFrom` / `uploadedTo` — filters on `createdAt` field
- `page` (default 1), `limit` (default 20, max 100)

Response:

```json
{ "status": "success", "total": 42, "results": 20, "data": [...] }
```

### POST /api/v1/admin/listings/bulk-revive

Body:

```json
{ "ids": ["<listingId>", ...] }
```

Response:

```json
{ "status": "success", "revived": ["<id>"], "failed": [{ "id": "<id>", "reason": "..." }] }
```

Failure reasons:

- `"Listing not found"` — invalid ObjectId or listing doesn't exist
- `"Listing is not inactive"` — listing is already active/pending
- `"Landlord already has an active listing"` — unique index constraint

## Known issues (from sanity check)

### 🔴 High

1. **No cap on `ids` array** — `bulkReviveListings` loops serially with no max-length guard. Add a 100-ID limit.

### 🟡 Medium

1. `paymentDeadline` used as "expiry date" — Listings that expired organically (never revived) have `paymentDeadline: null`. The `expiredFrom`/`expiredTo` filter and the "Date Expired" column in the UI will show blank for these. Consider adding an `inactiveSince` field.
2. `ProtectedRoutes` reads from `localStorage` — Role is not read from Redux state. Can be stale if store and localStorage diverge.

### 🟢 Low

1. **Dead stub file** — `real-app-backend-main/src/redux/api/adminApiSlice.ts` only exports a `BulkReviveFailure` interface and is unused in the backend. Delete it.
2. **Pagination renders all page buttons** — No ellipsis/windowed pagination. Will be unwieldy with 25+ pages.
3. `invalidatesTags: ["AdminListing"]` is redundant — The component uses `useLazyGetInactiveListingsQuery` so tag invalidation has no effect. The manual `triggerSearch` re-fetch is the actual mechanism.

## Listing status enum

```
"pending_payment" | "early_access" | "active" | "inactive"
```

Unique partial index on `{ user: 1 }` for statuses `["active", "pending_payment", "early_access"]` — one active listing per landlord enforced at DB level.

## How to create an admin user locally

Use the seed script or directly update a user's role in MongoDB:

```
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

Then log in normally — the JWT will carry the `admin` role and the backend `requireRole("admin")` middleware will grant access.
