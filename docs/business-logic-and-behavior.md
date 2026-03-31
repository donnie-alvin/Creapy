# Landlord Dashboard Business Logic and Behavior

## Scope
This document outlines the runtime business logic and visible behavior implemented in:
- `real-app-frontend-main/src/views/Dashboard/Landlord.tsx`
- `real-app-frontend-main/src/redux/api/listingApiSlice.ts`
- `real-app-frontend-main/src/redux/api/paymentApiSlice.ts`

## Data Dependencies
- Current user identity is read via `selectedUserId` from auth state.
- Listings are loaded using `useGetListingQuery(userId)`.
- Payments are loaded using `useGetMyPaymentsQuery()`.
- Listing deletion is performed using `useDeleteListingMutation()`.

## Listing Section Behavior (`My Listings`)
- If listings are loading:
  - Show `OverlayLoader`.
- If listings array is empty:
  - Show empty-state card with a CTA button to `/create-listing`.
- If listings exist:
  - Render a table with columns: `Listing`, `Location`, `Status`, `Published`, `Actions`.
  - Clicking listing name navigates to `/listing/{listingId}`.
  - Location shows `—` when missing.
  - Published date:
    - Uses `publishedAt` when present.
    - Falls back to `—` when absent.

## Listing Status Rules
- `pending_payment` -> badge label `Pending Payment`.
- `early_access` -> badge label `Early Access`.
- `active` -> badge label `Active`.
- Any other status -> badge label `Inactive`.

## Listing Action Rules
- If listing status is `pending_payment`:
  - Show `Pay Now` button.
  - Clicking navigates to `/listings/{listingId}/pay`.
- Otherwise:
  - Show `Edit` icon action:
    - Tooltip: `Edit listing`.
    - Clicking navigates to `/listings/{listingId}`.
  - Show `Delete` icon action:
    - Tooltip: `Delete listing`.
    - Clicking calls `deleteListing(listingId)`.
    - Button is disabled while delete mutation is loading.

## Payment History Section Behavior
- If payments are loading:
  - Show `Loading...`.
- If payments array is empty:
  - Show empty-state card text: `No payment history yet.`
- If payments exist:
  - Render a table with columns: `Date`, `Listing`, `Amount`, `Status`.
  - Date is formatted using `convertToFormattedDate(createdAt)`.
  - Listing name falls back to `—` when missing.
  - Amount is displayed as `USD {amount}`.

## Payment Status Rules
- `pending` -> badge label `Pending`.
- `success` -> badge label `Success`.
- Any other value -> badge label `Failed`.

## API Contract Summary (Frontend RTK Query)
### Listings
- `GET listings/user/{userId}` -> fetch current landlord listings.
- `DELETE listings/{listingId}` -> remove listing.
- Listing tag behavior:
  - Queries provide `Listing`.
  - Mutations invalidate `Listing`.

### Payments
- `GET payments/mine` -> fetch current user payments.
- Payment tag behavior:
  - Query provides `Payment`.
  - Payment initiation mutations invalidate `Payment`.

## Notes
- Current implementation does not define explicit error-state rendering in `Landlord.tsx`; behavior is primarily loading/empty/populated.
- Presentation styling (table containers and action icon button styles) is UI-only and does not alter business logic.
