# Project Plan

## Implemented workstreams in the current repository

1. Backend API foundation
   - Express app setup, global error handling, CORS, and rate limiting are present.
2. Identity and access
   - Signup, login, Google login, JWT protection, optional auth, role checks.
3. Listing lifecycle and search
   - Listing CRUD, public search, home feeds, and lifecycle transitions.
4. Payments
   - Listing-fee initiation, tenant premium initiation, provider abstraction, webhook processing.
5. Tenant retention
   - Saved searches plus email notification on listing creation.
6. Media
   - Signed upload URLs for Cloudflare R2.
7. Frontend delivery
   - Route-level views for public browsing, landlord dashboard, tenant dashboard, listing create/edit, and payment flow.
8. Deployment
   - Amplify monorepo config plus backend compute manifest.

## Open items implied by the repository

1. Add or remove the missing seed script referenced by backend `package.json`.
2. Reconcile payment success copy with backend post-payment listing state.
3. Clarify or redesign `GET /users/:id`, because current behavior returns the owner of a listing rather than a user by id.
4. Add automated coverage for frontend route behavior and API integration; only backend node tests are present.
