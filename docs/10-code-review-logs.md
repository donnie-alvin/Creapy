# Code Review Logs

## Verification log against the current repository

| ID | Area | Observation grounded in code |
|---|---|---|
| `CR-01` | User lookup | `authController.getUser` expects a listing id and returns that listing's owner, despite living on `GET /users/:id`. |
| `CR-02` | Payment copy drift | `webhookController` sets paid listing fees to `status: "active"`, while `Dashboard/Payment.tsx` success copy says the listing is live in early access for 24 hours. |
| `CR-03` | Seed script drift | Backend `package.json` exposes `npm run seed`, but no `seed/seed.js` exists in the repository. |
| `CR-04` | Lifecycle protection | `updateListing` blocks writes to `status`, `paymentDeadline`, `publishedAt`, and `earlyAccessUntil`, which is consistent with controller-owned lifecycle state. |
| `CR-05` | Idempotent webhook | Webhook processing uses an atomic payment claim keyed by `transactionRef` plus `webhookVerified: false`, preventing duplicate side effects. |
| `CR-06` | Public/private listing visibility | Public feeds use `optionalAuth`, so the same endpoint serves anonymous, free, and premium users with different visibility rules. |

## Review outcome

The documentation in this suite is written to the current code, including the mismatches above, rather than to a target design that is not fully implemented.
