# Support, Maintenance, and Changelog

## Support references

- Frontend build config: `real-app-frontend-main/amplify.yml`
- Backend build config: `amplify.yml` and `real-app-backend-main/deploy-manifest.json`
- Backend deployment notes: `real-app-backend-main/DEPLOYMENT.md`
- Frontend environment notes: `real-app-frontend-main/AMPLIFY_ENV.md`

## Maintenance checklist

- Keep `FRONTEND_URL` aligned to the deployed frontend origin.
- Keep `REACT_APP_API_URL` aligned to backend origin plus `/api/v1`.
- Keep Paynow credentials and callback URLs synchronized with the deployed backend and frontend.
- Ensure `R2_PUBLIC_BASE_URL` has no trailing slash mismatch, because upload controller normalizes with `.replace(/\/$/, "")`.
- Review the missing backend seed script reference before relying on `npm run seed`.

## Changelog

### 2026-03-07

- Verified that the root `docs/` directory is present and git-ignored by `.gitignore`.
- Rewrote the required documentation set `01-project-charter.md` through `16-support-maintenance-changelog.md` against the current codebase.
- Removed prior claims that were not backed by the repository, such as a checked-in seed script and a backend revive route.
