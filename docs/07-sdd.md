# Software Design Document

## Architecture

- Presentation: React SPA with React Router and RTK Query
- Application API: Express app with controllers and middleware
- Persistence: MongoDB through Mongoose schemas
- External integrations: Paynow, Cloudflare R2, SMTP

## Design decisions present in code

- `optionalAuth` is used on public listing routes so premium visibility can change when a valid token is present.
- Listing lifecycle updates are centralized in `applyListingLifecycle()` and executed before feed endpoints.
- Payment provider selection is abstracted through `utils/paymentProvider.js`.
- Webhook idempotency is implemented with an atomic `findOneAndUpdate` claim on `Payment`.
- Email delivery is resilient locally because missing SMTP config downgrades to mock console logging.

## Backend module boundaries

- `controllers/authController.js`: identity, JWT auth, role checks
- `controllers/listingController.js`: lifecycle rules, CRUD, search, saved-search notification trigger
- `controllers/paymentController.js`: payment initiation and payment history
- `controllers/webhookController.js`: provider verification and post-payment side effects
- `controllers/uploadController.js`: signed upload URL generation

## Frontend module boundaries

- `src/App.tsx`: route composition
- `src/redux/api/*`: API contracts
- `src/views/Dashboard/*`: landlord, tenant, and payment flows
- `src/views/Listing/*`: create/update/detail flows
- `src/views/Home` and `src/views/Search`: browsing experiences
