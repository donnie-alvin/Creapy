# Monetization Rules

## Active Mode

- `MONETIZATION_MODE=LANDLORD_PAID` (default)
- Optional future mode: `TENANT_PAID` (not active in current UI flow)

## Business Rules Implemented

- Public listing browse and listing detail views are free and do not require payment UI.
- Tenants never pay and do not see upgrade prompts.
- Landlords can sign up and manage profile for free.
- Landlords must be paid before publishing listings.

## Current Frontend Behavior

- Listing browsing and viewing routes are public (`/`, `/search`, `/listing/:id`).
- Landlord listing creation/edit screen (`/create-listing`, `/listings/:id`) checks paid status and blocks submit when unpaid.
- Unpaid landlords see a "Subscribe to Publish" CTA that routes to profile.
- Profile includes landlord subscription activation flow (mock call) and no tenant payment flow.

## Paid Status Mapping

The frontend treats landlord as paid if any of these are present on the user object:

- `landlordPlan === "pro"`
- `subscriptionStatus === "active"`
- `isLandlordPaid === true`

This mapping is implemented in `src/config/monetization.ts`.

## Where To Change Plan Logic

- Feature flag parsing and paid status logic:
  - `src/config/monetization.ts`
- Auth selectors for publish access:
  - `src/redux/auth/authSlice.ts`
- Subscription state fetch + activation mutation:
  - `src/redux/api/userApiSlice.ts`
- Landlord publish UI enforcement:
  - `src/views/Listing/index.tsx`
- Profile subscription UX:
  - `src/views/Profile/index.tsx`

## Backend Contract Expected By Frontend

- `GET /api/v1/users/me` returns current user with role and paid status fields.
- Publish/create listing endpoints must enforce landlord paid status server-side and return `403` with clear messaging when unpaid.
