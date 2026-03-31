# Use Case Models

## Landlord publishes a listing

1. Landlord logs in and opens `/create-listing`.
2. Frontend uploads images to R2 using `GET /api/v1/uploads/r2-sign` plus direct `PUT` requests to the returned `uploadUrl`.
3. Frontend posts listing data to `POST /api/v1/listings`.
4. Backend sets `status: "active"`, `publishedAt`, and a 48-hour `paymentDeadline`.
5. Listing remains visible in public feeds until lifecycle rules later move it to `pending_payment` or `inactive`.

## Tenant browses listings

1. Anonymous or logged-in user opens `/` or `/search`.
2. Frontend calls listing search or home-feed endpoints.
3. Backend applies lifecycle updates before feed queries.
4. Non-premium viewers receive only `active` listings.
5. Premium viewers receive `active` and `early_access` listings.

## Landlord pays a listing fee

1. Landlord opens `/listings/:id/pay`.
2. Frontend verifies ownership by loading listing detail and current payment history.
3. Frontend posts `listingId` and `phone` to `POST /api/v1/payments/listing-fee`.
4. Provider returns `transactionRef` and instructions.
5. Frontend polls listing and payment data every 5 seconds.
6. Paynow webhook marks the payment successful and updates the listing to `status: "active"` with `paymentDeadline: null`.

## Tenant upgrades to premium

1. Tenant opens `/dashboard/tenant`.
2. Frontend posts `phone` to `POST /api/v1/payments/tenant-premium`.
3. Frontend polls `GET /api/v1/users/me` every 5 seconds.
4. Webhook extends `premiumExpiry` by 30 days from now or from current unexpired premium.

## Tenant saves a search

1. Tenant opens `/saved-searches` or manages searches from the tenant dashboard.
2. Frontend posts a `criteria` object to `POST /api/v1/saved-searches`.
3. On future listing creation, backend compares the new listing against all active saved searches and sends email or console-log notifications.
