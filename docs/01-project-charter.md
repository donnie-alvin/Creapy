# Project Charter

## Project

- Name: `Creapy`
- Repository shape: root repo with `real-app-backend-main/` and `real-app-frontend-main/`
- Product type: rental listing marketplace with landlord publishing, tenant browsing, optional tenant premium, saved searches, and image upload support

## Current implementation goal

The codebase delivers a React single-page application backed by an Express API and MongoDB models for:

- user signup/login and Google login
- landlord listing creation, update, delete, and dashboard management
- tenant saved searches
- listing-fee payment initiation
- tenant premium payment initiation
- Paynow webhook processing
- direct-to-Cloudflare-R2 image upload via signed URLs

## In-scope modules

- Frontend SPA: `real-app-frontend-main/src/App.tsx`
- Backend API bootstrap: `real-app-backend-main/app.js`
- Backend runtime entry: `real-app-backend-main/server.js`
- Data models: `real-app-backend-main/models/*.js`

## Key constraints from the code

- Authentication is JWT-based and stored in local storage on the frontend.
- Landlords can have only one listing whose status is not `inactive`, enforced both in controller logic and a partial unique MongoDB index.
- Public listing visibility depends on `status` and tenant premium state.
- Payment provider is selected by `PAYMENT_PROVIDER` and defaults to `mock` when unset.

## Out-of-scope in the current tree

- Admin back office
- recurring billing
- multi-currency support
- documented DB seed assets in source control
- any backend route for reviving a listing before payment; the current payment flow accepts `inactive` listings directly
