# Putting ScamShield AI live (Render)

The whole app — website, API, model — runs as **one service** on
[Render](https://render.com), with a Postgres database for accounts and history.
Render builds everything from your GitHub repository using the `Dockerfile` and
`render.yaml` in this folder. You do **not** need Docker on your computer.

Time needed: about 20 minutes, most of it waiting for the first build.

---

## 1. Put the code on GitHub

1. Create a free account at <https://github.com> (skip if you have one).
2. Click **+ → New repository**. Name it `scamshield`. Choose **Private** or
   **Public**. Do **not** tick "Add a README" (the project already has one).
   Click **Create repository**.
3. In a terminal in the project folder, run (replace `YOUR-USERNAME`):

   ```powershell
   git remote add origin https://github.com/YOUR-USERNAME/scamshield.git
   git push -u origin main
   ```

   The first push opens a browser window asking you to sign in to GitHub — that's
   normal. After it finishes, refresh the GitHub page and you'll see your files.

> The model files (`backend/*.joblib`, ~7 MB) are included on purpose — the live
> site needs them. Your local database, `node_modules`, and `.venv` are not.

## 2. Create the service on Render

1. Sign up at <https://render.com> using **"Sign in with GitHub"**.
2. In the Render dashboard click **New + → Blueprint**.
3. Connect your GitHub account if asked, then pick the **scamshield** repository.
4. Render reads `render.yaml` and shows two resources:
   - **scamshield** — web service (app + API), free plan
   - **scamshield-db** — Postgres database, free plan
5. Click **Apply** / **Deploy Blueprint**.

Render now builds the site (≈5–10 minutes the first time). Watch the **Logs**
tab of the *scamshield* service. It's ready when you see a line like
`Decision threshold: 0.55 | ready: True` and the status turns **Live**.

`SECRET_KEY` and `DATABASE_URL` are set for you automatically — don't share them.

## 3. Check that it works

Your address is shown at the top of the service page, e.g.
`https://scamshield-xxxx.onrender.com`.

1. Open `https://YOUR-ADDRESS/api/health` → should show `"ready": true`.
2. Open `https://YOUR-ADDRESS` → create an account → analyze a listing →
   check Dashboard and History.

## 4. Updating the live site

Make your changes, then:

```powershell
git add -A
git commit -m "Describe your change"
git push
```

Render rebuilds and redeploys automatically. Accounts and history are kept
(they live in the database, not in the code).

---

## Good to know about the free plan

- **Sleeping:** a free web service sleeps after ~15 minutes without visitors.
  The next visit wakes it up, which takes up to a minute. Paid plans don't sleep.
- **Free database is time-limited:** Render's free Postgres databases expire
  after a limited period (about a month at the time of writing — check Render's
  pricing page). Before then, either upgrade the database, or create a free
  database elsewhere (e.g. [Neon](https://neon.tech)), and paste its connection
  string as the `DATABASE_URL` environment variable of the *scamshield* service.
- **Memory:** with the model loaded the app uses about 190 MB (measured locally),
  which fits the free plan's 512 MB.

## If something goes wrong

| What you see | What to do |
| --- | --- |
| Build fails in Render logs | Read the last red lines; usually a file missing from GitHub. Check it's committed and pushed |
| `/api/health` shows `"ready": false` | The `errors` list says which model file failed to load |
| Site loads but every sign-in fails | Check the service has `DATABASE_URL` and `SECRET_KEY` under **Environment** |
| Everyone got signed out | `SECRET_KEY` changed — normal after editing it; just sign in again |
| First visit very slow | The free service was asleep; wait a minute |
