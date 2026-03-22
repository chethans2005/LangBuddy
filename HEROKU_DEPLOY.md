Heroku deployment (single-server)
================================

Steps to deploy this monorepo to Heroku (backend serves the frontend build):

1. Create a Heroku app and add a MongoDB add-on or use MongoDB Atlas.

2. Set required environment variables on the Heroku app settings:
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET_KEY` — secret for signing JWTs
- `STEAM_API_KEY` and `STEAM_API_SECRET` — Stream credentials
- `GOOGLE_CLIENT_ID` — Google OAuth client id (optional)
- `CORS_ORIGIN` — allowed origin (optional)
- `NODE_ENV` — set to `production` (Heroku sets this automatically)

3. Push the repo to GitHub and connect the Heroku app to the GitHub repo (Heroku GitHub integration) OR push directly via `git push heroku main`.

4. Heroku will run `npm install` in the repo root and then run the `heroku-postbuild` script defined in `package.json` which:
   - installs dependencies in `frontend`,
   - builds the frontend (`frontend/dist`),
   - copies the built `dist` into `backend/frontend/dist` so the Express server can serve it in production.

5. Heroku then starts the app using the `Procfile` which runs `npm run start` (starts the backend server). The backend server serves API routes and the built frontend.

Commands (local test)
---------------------
Build frontend and run backend locally in production mode:

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

Notes
-----
- Heroku sets `PORT` automatically; the server reads `process.env.PORT`.
- The `cp -a` command used in `heroku-postbuild` runs on Heroku's Linux environment. For any Windows-only local scripts, run the local commands shown above.
