# Feasibility Study

## Technical feasibility

- Backend stack is conventional and already wired: Express 4, Mongoose 8, JWT auth, `express-rate-limit`, `express-validator`, `nodemailer`, and Paynow.
- Frontend stack is conventional and already wired: React 18, TypeScript, MUI, Redux Toolkit, and RTK Query.
- Deployment artifacts exist for AWS Amplify at repo root and in both app subdirectories.
- Direct file upload is feasible because the backend signs Cloudflare R2 upload URLs in `controllers/uploadController.js`.

## Operational feasibility

- The server fails fast on missing or unreachable MongoDB by disabling Mongoose command buffering and using a `5000ms` server-selection timeout.
- CORS is parameterized off `FRONTEND_URL`, with trailing slash normalization in `app.js`.
- When SMTP variables are missing, saved-search notifications fall back to console logging instead of hard failing.

## Commercial feasibility reflected in code

- Listing publication charges use `LISTING_FEE_AMOUNT`.
- Tenant premium charges use `TENANT_PREMIUM_AMOUNT`.
- Amount enforcement is delegated to the selected payment provider implementation.

## Risks and caveats in the current implementation

- `real-app-backend-main/package.json` references `node seed/seed.js`, but no `seed/` directory exists in the repository.
- The payment success UI in `src/views/Dashboard/Payment.tsx` says the listing is live in early access for 24 hours, but the webhook controller sets paid listings to `status: "active"` and clears `paymentDeadline`.
- `GET /api/v1/users/:id` treats the path parameter as a listing id, not a user id, because `authController.getUser` loads a listing first and then its owner.
