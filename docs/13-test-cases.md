# Test Cases

| ID | Case | Input | Expected result |
|---|---|---|---|
| `TC-01` | Create landlord listing | valid `POST /api/v1/listings` payload from landlord | `201`, listing created with `status: "active"` and non-null `paymentDeadline` |
| `TC-02` | Block second live listing | second create request for same landlord while another listing is not `inactive` | `400` with single-active-listing message |
| `TC-03` | Public feed for anonymous user | `GET /api/v1/listings` without token | only `active` listings returned |
| `TC-04` | Public feed for premium tenant | `GET /api/v1/listings` with premium tenant token | `active` and `early_access` listings returned |
| `TC-05` | Public detail hides pending payment | `GET /api/v1/listings/listing/:id` for `pending_payment` listing as non-owner | `404` |
| `TC-06` | Owner can still view listing | same detail request as listing owner | `200` even for `pending_payment` or `early_access` |
| `TC-07` | Initiate listing-fee payment | landlord posts `listingId` and `phone` for `pending_payment` or `inactive` listing | payment record created with `type: "listing_fee"` and `status: "pending"` |
| `TC-08` | Reject listing-fee payment for active listing | landlord posts active listing id | `400` with `Listing is not awaiting payment` |
| `TC-09` | Initiate tenant premium payment | tenant posts `phone` | payment record created with `type: "premium_subscription"` |
| `TC-10` | Ignore invalid webhook | webhook with invalid hash | `200` and `{ status: "ignored", reason: "invalid hash" }` |
| `TC-11` | Duplicate webhook no-op | same successful webhook twice | second call returns `{ status: "ok", reason: "already processed" }` |
| `TC-12` | Saved-search ownership check | delete search owned by another tenant | `403` |
