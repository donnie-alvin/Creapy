# Database Scripts

## Database-related assets currently present

- Mongoose connection bootstrap in `real-app-backend-main/server.js`
- Mongoose schemas in `real-app-backend-main/models/`
- MongoDB indexes declared in schema files

## Declared scripts

- `npm run start`
- `npm run server`
- `npm run test:home-feeds`
- `npm run test:monetization`
- `npm run seed`

## Current gap

`npm run seed` points to `node seed/seed.js`, but the repository does not contain `real-app-backend-main/seed/seed.js`. There is therefore no checked-in seed or migration script to document beyond the schema indexes below.

## Indexes defined in code

- `Listing`: unique partial index on `{ user: 1 }` where status is one of `active`, `pending_payment`, `early_access`
- `Payment`: sparse unique index semantics on `transactionRef`
- `SavedSearch`: indexes on `user` and `isActive`
