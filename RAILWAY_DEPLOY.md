Railway deployment (single-server)
=================================

Quick setup to deploy this monorepo to Railway (backend serves frontend):

1. Create a Railway project and connect your GitHub repository, or use the Railway CLI (`railway init` / `railway up`).

2. Project settings:
   - Build Command: `npm run build`
   - Start Command: `npm run start`
   - Environment: set `NODE_ENV` to `production` (Railway may set this automatically)

3. Add variables (Railway → Project → Variables):
   - `MONGO_URI` — MongoDB connection string
   - `JWT_SECRET_KEY` — JWT signing secret
   - `STEAM_API_KEY` and `STEAM_API_SECRET` — Stream credentials
   - `GOOGLE_CLIENT_ID` — Google OAuth client id (optional)
   - `CORS_ORIGIN` — optional allowed origin

4. Enable Auto Deploy for the branch you want (e.g., `main`). Railway will run `npm run build`, which builds the frontend and copies `frontend/dist` into `backend/frontend/dist`, then run `npm run start` to start the backend server.

Local test (build + run backend in production):

PowerShell:
```
cd frontend
npm install
npm run build
cd ..\backend
$env:NODE_ENV="production"; $env:PORT=3000; $env:MONGO_URI="your_mongo_uri"
npm install
npm start
```

Notes:
- The root `build` script copies the frontend build into `backend/frontend/dist` so Express can serve it.
- Railway will use the Node version declared in `engines` in `package.json` when supported.
