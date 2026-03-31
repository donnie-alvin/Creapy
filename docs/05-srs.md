# Software Requirements Specification

## Backend API requirements

### Users

| Method | Path | Middleware | Behavior |
|---|---|---|---|
| `POST` | `/api/v1/users/signup` | public | create user with `username`, `email`, `password`, optional `role` |
| `POST` | `/api/v1/users/login` | public | email/password login |
| `POST` | `/api/v1/users/google` | public | create or reuse user by email |
| `GET` | `/api/v1/users/me` | `protect` | return current authenticated user |
| `GET` | `/api/v1/users/:id` | public | returns owner of listing `:id`, based on controller logic |
| `PUT` | `/api/v1/users/update/:id` | `protect` | update user from `req.body.payload` |
| `DELETE` | `/api/v1/users/delete/:id` | `protect` | delete user |

### Listings

| Method | Path | Middleware | Behavior |
|---|---|---|---|
| `GET` | `/api/v1/listings` | `optionalAuth` | paginated search |
| `GET` | `/api/v1/listings/get` | `optionalAuth` | alias of list/search |
| `GET` | `/api/v1/listings/home/highlighted` | `optionalAuth` | most recent visible listings |
| `GET` | `/api/v1/listings/home/grouped-by-location` | `optionalAuth` | grouped feed by normalized location |
| `GET` | `/api/v1/listings/listing/:id` | `optionalAuth` | visibility-aware detail |
| `GET` | `/api/v1/listings/:id` | public | legacy detail route |
| `POST` | `/api/v1/listings` | `protect`, `requireRole("landlord")`, validators | create listing |
| `GET` | `/api/v1/listings/user/:id` | `protect`, `requireRole("landlord")` | fetch listings by user id |
| `PUT` | `/api/v1/listings/:id` | `protect`, `requireRole("landlord")` | update listing; lifecycle fields blocked |
| `DELETE` | `/api/v1/listings/:id` | `protect`, `requireRole("landlord")` | delete owned listing |

### Payments

| Method | Path | Middleware | Behavior |
|---|---|---|---|
| `POST` | `/api/v1/payments/listing-fee` | `paymentLimiter`, `protect`, `requireRole("landlord")`, validators | initiate payment for listing in `pending_payment` or `inactive` |
| `POST` | `/api/v1/payments/tenant-premium` | `paymentLimiter`, `protect`, `requireRole("tenant")`, validators | initiate tenant premium payment |
| `GET` | `/api/v1/payments/mine` | `paymentLimiter`, `protect` | current user's payment history |

### Saved searches

| Method | Path | Middleware | Behavior |
|---|---|---|---|
| `POST` | `/api/v1/saved-searches` | `protect`, `requireRole("tenant")` | create saved search |
| `GET` | `/api/v1/saved-searches/mine` | `protect`, `requireRole("tenant")` | list current tenant searches |
| `DELETE` | `/api/v1/saved-searches/:id` | `protect`, `requireRole("tenant")` | delete owned search |

### Uploads and webhooks

| Method | Path | Middleware | Behavior |
|---|---|---|---|
| `GET` | `/api/v1/uploads/r2-sign` | `protect` | return signed upload URL and public URL |
| `POST` | `/webhooks/payment` | `express.urlencoded` | process provider webhook |

## Frontend requirements

- `REACT_APP_API_URL` must include `/api/v1` because RTK Query uses relative endpoint paths like `users/login` and `listings`.
- `REACT_APP_BACKEND_URL` must point to the backend origin because listing image upload signs against `/api/v1/uploads/r2-sign`.
- Route protection depends on a serialized `user` object in local storage.
