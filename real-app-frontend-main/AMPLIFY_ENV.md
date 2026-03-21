# Amplify Environment Variables Checklist

> ⚠️ **IMPORTANT — Read before deploying**
> The values for `REACT_APP_API_URL` and `REACT_APP_BACKEND_URL` in `.env.production` are **non-functional placeholder templates** (they contain `<amplify-backend-branch>` and `<appid>` tokens). They will **not** work unless overridden in the AWS Amplify Console. A production build without these overrides will silently use broken URLs, causing all API calls (including auth and upload) to fail.
> **You must set these variables in the Amplify Console under App settings -> Environment variables before triggering any production build.**

Amplify backend is the canonical production target. See `real-app-backend-main/DEPLOYMENT.md` for the full setup guide.

Set these in AWS Amplify under **App settings -> Environment variables** before triggering a production build.

| Variable | Value / Source |
|---|---|
| `REACT_APP_API_URL` | Your Amplify backend URL + `/api/v1` (e.g. `https://<branch>.<appid>.amplifyapp.com/api/v1`) |
| `REACT_APP_BACKEND_URL` | Your Amplify backend URL (no path) (e.g. `https://<branch>.<appid>.amplifyapp.com`) |
| `REACT_APP_FIREBASE_API_KEY` | From Firebase project settings |
| `REACT_APP_MONETIZATION_MODE` | `LANDLORD_PAID` |
| `REACT_APP_LISTING_FEE_AMOUNT` | `5` |
| `REACT_APP_TENANT_PREMIUM_AMOUNT` | `10` |
| `DISABLE_ESLINT_PLUGIN` | `true` |
