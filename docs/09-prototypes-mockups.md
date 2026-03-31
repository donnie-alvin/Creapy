# Prototypes and Mockups

This file maps the implemented UI surface rather than external design assets.

## Primary screens in the current frontend

| Screen | Route | Source file | Notes |
|---|---|---|---|
| Home | `/` | `src/views/Home/index.tsx` | hero, highlighted listings, grouped-by-location carousels |
| Search | `/search` | `src/views/Search/index.tsx` | filter sidebar plus paginated fetch-more browsing |
| Listing detail | `/listing/:id` | `src/views/Listing/components/viewListing.tsx` | shows images, summary, owner details |
| Listing create/edit | `/create-listing`, `/listings/:id` | `src/views/Listing/index.tsx` | shared form for create and update |
| Landlord dashboard | `/dashboard/landlord` | `src/views/Dashboard/Landlord.tsx` | listings table and payment history |
| Tenant dashboard | `/dashboard/tenant` | `src/views/Dashboard/Tenant.tsx` | premium card plus saved searches |
| Listing payment | `/listings/:id/pay` | `src/views/Dashboard/Payment.tsx` | idle, polling, success states |
| Saved searches | `/saved-searches` | `src/views/SavedSearches/index.tsx` | tenant-only CRUD page |

## UX states explicitly implemented

- loading overlays on listing-heavy pages
- empty states for landlord listings, payment history, and saved searches
- payment polling every 5 seconds in both landlord and tenant payment experiences
- route guards through `ProtectedRoutes` and `PublicRoutes`
