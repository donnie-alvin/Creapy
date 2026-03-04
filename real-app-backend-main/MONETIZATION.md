# Monetization

## Mode

- `MONETIZATION_MODE=LANDLORD_PAID` (default)
- Optional future mode: `TENANT_PAID` (kept as structure only)

## Business Rules

- Landlords pay a per-listing activation fee.
- Tenants can subscribe to premium access for 30 days.

## Enforcement Points

- Listing `status` state machine: `pending_payment` -> `early_access` -> `active`

## Payment Endpoints

- `POST /api/v1/payments/listing-fee`
- `POST /api/v1/payments/tenant-premium`
- `GET /api/v1/payments/mine`

## Webhook

- `POST /webhooks/payment` (Paynow result URL)
