# Monetization

## Mode

- `MONETIZATION_MODE=LANDLORD_PAID` (default)
- Optional future mode: `TENANT_PAID` (kept as structure only)

## Business Rules

- Public browse and listing detail endpoints are open:
  - `GET /api/v1/listings`
  - `GET /api/v1/listings/get`
  - `GET /api/v1/listings/:id`
  - `GET /api/v1/listings/listing/:id`
- Tenants never pay and do not require premium flags for saved searches.
- Landlords must have the landlord role to publish (create/update) listings.

## Enforcement Points

- Listing create/update routes:
  - `POST /api/v1/listings`
  - `PUT /api/v1/listings/:id`
- Listing image signed uploads (folder `listings`) via:
  - `GET /api/v1/uploads/r2-sign`

## Subscription Update

- Endpoint: `POST /api/v1/payments/premium`
- Alias: `POST /api/v1/payments/landlord-subscription`
- On success sets:
  - `landlordPlan = "pro"`
  - `landlordPaidUntil` (default +30 days)

## User Subscription State Endpoint

- `GET /api/v1/users/me` returns authenticated user with role and landlord subscription fields.
