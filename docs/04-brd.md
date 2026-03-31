# Business Requirements Document

## Business requirements reflected by code

- Landlords must be able to create one rental listing at a time and manage it from a dashboard.
- Tenants must be able to browse public listings without authentication.
- Tenants with an active `premiumExpiry` must be able to see `early_access` listings in feeds and detail pages.
- Landlords must pay a listing activation fee only when a listing is in `pending_payment` or `inactive`.
- Tenants must be able to buy a 30-day premium extension.
- Tenant users must be able to store saved searches and receive notification attempts for matching newly created listings.
- Listing images must upload through signed object-storage URLs rather than through app-server file streaming.

## Derived business rules from implementation

- Only `type === "rent"` passes backend create validation.
- Public feed visibility is:
  - free or anonymous user: `status === "active"`
  - premium tenant: `status in ["active", "early_access"]`
- Public detail visibility additionally blocks `pending_payment`.
- Owners can still view their own listing regardless of `pending_payment` or `early_access`.
- A landlord cannot create another listing while any existing listing has status other than `inactive`.

## Notable requirement drift visible in code

- The UI exposes an edit route at `/listings/:id`, but there is no dedicated revive route in the backend.
- The landlord payment screen presents the outcome as early access, while the backend persists paid listings as `active`.
