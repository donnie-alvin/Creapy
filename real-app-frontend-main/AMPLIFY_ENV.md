# Amplify Environment Variables Checklist

Set these in AWS Amplify under **App settings -> Environment variables** before triggering a production build.

| Variable | Value / Source |
|---|---|
| `REACT_APP_API_URL` | Your backend Render URL + `/api/v1` |
| `REACT_APP_BACKEND_URL` | Your backend Render URL (no path) |
| `REACT_APP_FIREBASE_API_KEY` | From Firebase project settings |
| `REACT_APP_MONETIZATION_MODE` | `LANDLORD_PAID` |
| `REACT_APP_LISTING_FEE_AMOUNT` | `5` |
| `REACT_APP_TENANT_PREMIUM_AMOUNT` | `10` |
| `DISABLE_ESLINT_PLUGIN` | `true` |
