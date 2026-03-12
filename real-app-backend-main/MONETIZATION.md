# Monetization

## Mode

- `MONETIZATION_MODE=LANDLORD_PAID` (default)
- Optional future mode: `TENANT_PAID` (kept as structure only)

## Business Rules

- Landlords pay a per-listing activation fee.
- Tenants can subscribe to premium access for 30 days.

## Enforcement Points

- Listing `status` state machine: `pending_payment` → `early_access` (`POST /webhooks/payment?earlyAccess=true`, mock-provider only, sets listing to `early_access` for 7 days) → `active` (standard webhook)

## Payment Endpoints

- `POST /api/v1/payments/listing-fee`
- `POST /api/v1/payments/tenant-premium`
- `GET /api/v1/payments/mine`

## Webhook

- `POST /webhooks/payment` (Paynow result URL)

## E2E Test Suite

The modular runner is at `tests/e2e/runner.js`. It runs five test groups sequentially with fail-fast behaviour.

| File | Covers |
|---|---|
| `tests/e2e/auth.js` | Signup (landlord + tenant), duplicate email rejection, login, wrong password, `GET /me` with/without token, protected route guards |
| `tests/e2e/listings.js` | Create listing, active status assertion, 1-listing limit, tenant access-control (create/update/delete), update listing, public feed, all filters (location, minRent/maxRent, minTotalRooms, solar, searchTerm, minBedrooms, furnished), home highlighted, grouped-by-location |
| `tests/e2e/payments.js` | Initiate listing fee, `pending_payment` visibility, `earlyAccess` webhook, early_access gate for non-premium tenant, initiate tenant premium, premium webhook, early_access visible to premium tenant, webhook idempotency, `GET /payments/mine` for both roles, cross-role access control |
| `tests/e2e/saved-searches.js` | Landlord blocked from creating/listing saved searches, tenant creates saved search, `GET /mine`, delete, `GET /mine` after delete |
| `tests/e2e/profile.js` | `GET /me` for both roles, update landlord profile (returns new token + updated fields), `GET /me` after update |

`POST /webhooks/payment?earlyAccess=true` is mock-provider only (`PAYMENT_PROVIDER !== "paynow"`). It sets the listing to `early_access` for 7 days instead of `active`.

Run the suite with:

```sh
PAYMENT_PROVIDER=mock npm run test:e2e
```
