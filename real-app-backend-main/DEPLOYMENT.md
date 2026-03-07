# Deployment

## Canonical deployment: AWS Amplify (backend) + AWS Amplify (frontend)

| Section | Content |
|---|---|
| **Backend Amplify setup** | Connect repo, set root directory to `real-app-backend-main`, Amplify builds a `.amplify-hosting` bundle using `amplify.yml` and `deploy-manifest.json` |
| **Backend environment variables** | Table of every variable in `.env.example` with descriptions; note `PAYNOW_RESULT_URL` must use Amplify backend URL, `FRONTEND_URL` must use Amplify frontend URL |
| **Frontend Amplify setup** | Connect repo, set root directory to `real-app-frontend-main`, Amplify uses existing `amplify.yml` |
| **Frontend environment variables** | Table matching `AMPLIFY_ENV.md` but with Amplify backend URL as canonical |
| **Paynow webhook** | Paynow merchant dashboard -> Result URL = `https://<backend-amplify-url>/webhooks/payment`; Return URL = `https://<frontend-amplify-url>/payment-complete` |
| **CORS** | `FRONTEND_URL` env var on backend must equal the Amplify frontend origin exactly |
| **Local development** | Unchanged: `npm start` in `real-app-backend-main/`, `npm start` in `real-app-frontend-main/`, `.env` from `.env.example` with `localhost` values |
| **Legacy Render fallback** | `render.yaml` is retained for rollback only -- see notes in that file |

## Amplify backend artifact layout

Amplify backend hosting expects the build output in the following structure:

- `.amplify-hosting/deploy-manifest.json`
- `.amplify-hosting/compute/default/server.js`
- `.amplify-hosting/compute/default/` with all backend source files and runtime dependencies required by `server.js`

## Backend environment variables

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` runtime mode |
| `PORT` | Port the API server listens on |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | JWT expiration window (e.g. `30d`) |
| `MONETIZATION_MODE` | Monetization mode flag (default `LANDLORD_PAID`) |
| `PAYMENT_PROVIDER` | Payment provider selector (e.g. `mock`, `paynow`) |
| `PAYNOW_INTEGRATION_ID` | Paynow integration ID |
| `PAYNOW_INTEGRATION_KEY` | Paynow integration key |
| `PAYNOW_RESULT_URL` | Must be the Amplify backend compute URL + `/webhooks/payment` |
| `PAYNOW_RETURN_URL` | Must be the Amplify frontend URL + `/payment-complete` |
| `LISTING_FEE_AMOUNT` | Per-listing activation fee amount |
| `TENANT_PREMIUM_AMOUNT` | Tenant premium subscription amount |
| `SMTP_HOST` | SMTP host for transactional email |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_SECURE` | `true` for TLS-enabled SMTP |
| `EMAIL_FROM` | From address for outbound emails |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key ID |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret access key |
| `R2_BUCKET` | Cloudflare R2 bucket name |
| `R2_PUBLIC_BASE_URL` | Public base URL for stored assets |
| `FRONTEND_URL` | Must be the Amplify frontend origin (no path) |
| `SEED_API_BASE` | Optional base URL for `npm run seed` when seeding a deployed backend |

## Frontend environment variables

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Amplify backend URL + `/api/v1` (e.g. `https://<branch>.<appid>.amplifyapp.com/api/v1`) |
| `REACT_APP_BACKEND_URL` | Amplify backend URL (e.g. `https://<branch>.<appid>.amplifyapp.com`) |
| `REACT_APP_FIREBASE_API_KEY` | Firebase project API key |
| `REACT_APP_MONETIZATION_MODE` | `LANDLORD_PAID` |
| `REACT_APP_LISTING_FEE_AMOUNT` | `5` |
| `REACT_APP_TENANT_PREMIUM_AMOUNT` | `10` |
| `DISABLE_ESLINT_PLUGIN` | `true` |
