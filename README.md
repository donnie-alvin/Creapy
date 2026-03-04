# Creapy

## Deployment

1. Connect the `real-app-frontend-main` subdirectory to AWS Amplify. In Amplify monorepo settings, set **App root** to `real-app-frontend-main`.
2. Add all required environment variables in Amplify from `real-app-frontend-main/AMPLIFY_ENV.md`.
3. Amplify reads `real-app-frontend-main/amplify.yml`; confirm the build output directory is `build`.
4. Keep the backend on Render and set `FRONTEND_URL` on Render to the deployed Amplify URL after first frontend deploy.
5. Set `PAYNOW_RETURN_URL` on Render to the deployed Amplify frontend URL.

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GitHub as GitHub Repo
    participant Amplify as AWS Amplify
    participant Render as Render (Backend)

    Dev->>GitHub: Push to main branch
    GitHub->>Amplify: Webhook triggers build
    Amplify->>Amplify: Reads amplify.yml from real-app-frontend-main/
    Amplify->>Amplify: Injects REACT_APP_* env vars
    Amplify->>Amplify: npm ci -> npm run build -> artifacts/build/
    Amplify->>Amplify: Applies SPA rewrite rule (/* -> /index.html 200)
    Amplify-->>Dev: Deploy live at *.amplifyapp.com
    Dev->>Render: Update FRONTEND_URL + PAYNOW_RETURN_URL env vars
    Render-->>Amplify: CORS allows *.amplifyapp.com origin
```
