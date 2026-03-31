# User Manual

## Landlord

1. Sign up or log in with a landlord account.
2. Open `/create-listing`.
3. Upload at least two images; the frontend requests signed upload URLs from the backend and uploads files directly to R2.
4. Submit the listing form.
5. Manage the listing from `/dashboard/landlord`.
6. If the listing enters `pending_payment`, open `Pay Now` and submit an EcoCash number.
7. Wait on the polling screen until the payment is confirmed or retry if initiation fails.

## Tenant

1. Browse listings from `/` or `/search`.
2. Open `/dashboard/tenant` to review premium status and saved searches.
3. To upgrade, enter an EcoCash number and send the premium payment request.
4. Wait while the dashboard polls `GET /users/me` for an updated `premiumExpiry`.
5. Create or delete saved searches from `/saved-searches` or view them in the tenant dashboard.

## Important behavior

- Premium visibility depends on `premiumExpiry` being in the future.
- Public listing detail hides `pending_payment` and hides `early_access` unless the viewer is premium.
- Route protection relies on the `user` entry in local storage.
