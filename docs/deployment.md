## Deploying to Render

Follow this checklist to bring the API online for your front end.

1. **Push the backend to GitHub** (or another Git remote Render can read).
2. **Create the infrastructure**:
   - On Render click **New > Blueprint** and point it at this repo (or copy/paste `render.yaml` during setup).
   - The blueprint provision a free-tier Postgres instance (`bookaction-db`) plus a Node Web Service.
3. **Configure the Web Service**:
   - Build Command: `npm run build && npx prisma migrate deploy`
   - Start Command: `npm run start`
   - Environment variables:
     - `DATABASE_URL`: automatically filled from the managed database via the blueprint.
     - Add any other secrets from `.env` (e.g., analytics keys) manually in the Render dashboard.
4. **Initial data**:
   - After the first deploy open the Web Service ➜ **Shell** and run `npx prisma db seed`.
   - The seed script populates Module 1 content; rerun only when you intentionally want new copies of the sample data.
5. **Verify**:
   - Use Render's "Events" log to confirm `npm run build` succeeded.
   - Hit `https://<service-name>.onrender.com/api/users/1/learning_homepage` to confirm the API responds.
6. **Connect the frontend**:
   - Point your front-end environment variables (e.g., `VITE_API_BASE_URL`) at the Render URL.
   - Enable CORS in `src/app.ts` if the front end is hosted on a different domain.

### Local parity

The new `start`, `build`, and `postinstall` scripts mirror the Render build pipeline:

```bash
npm install
npm run build
npm start
```

Running those locally is the fastest way to catch deployment issues before pushing. 
