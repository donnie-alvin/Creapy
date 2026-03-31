# Test Plan

## Automated test scope currently in repository

- runner: Node built-in test runner
- commands:
  - `npm run test:monetization`
  - `npm run test:home-feeds`

## Covered backend behaviors

- route middleware placement for listing routes
- absence of `requirePremium` on saved-search routes
- listing-fee initiation success and rejection paths
- tenant premium initiation
- webhook invalid-hash handling
- home highlighted feed defaults and custom limit handling
- grouped-by-location aggregation structure and limits

## Manual verification areas still required

- full frontend login and route-guard flows
- image signing plus direct R2 upload
- end-to-end Paynow payment flow in a real environment
- saved-search email delivery with actual SMTP configuration
- Amplify deployment packaging for both apps
