# Release Notes

## Current repository release surface

- React frontend for home browsing, search, listing detail, signup/login, profile, saved searches, landlord dashboard, tenant dashboard, and listing payment
- Express backend with JWT auth, listing CRUD, payments, saved searches, uploads, and webhooks
- Listing lifecycle rules driven by `publishedAt`, `paymentDeadline`, and `earlyAccessUntil`
- Paynow provider plus mock provider abstraction
- Cloudflare R2 signed upload support
- AWS Amplify deployment descriptors for frontend hosting and backend compute

## Known implementation notes

- The repository documents an Amplify-first deployment path and still keeps a `render.yaml`.
- Some UX text and route semantics do not fully align with backend behavior; see `10-code-review-logs.md`.
