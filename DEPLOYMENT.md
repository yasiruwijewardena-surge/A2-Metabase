# Deployment runbook

Deploying the Strapi CMS to the Railway project `L2-Promotion-Assignment-Yasiru`
(environment `production`), with Postgres for data and Cloudinary for media.

Order matters: Railway deploys from GitHub, so the repository has to exist and
be pushed before the Railway service can be created.

---

## Step 0 — Prerequisites

| Need | Where |
|---|---|
| GitHub account | the brief requires GitHub specifically (§4.2 items 4 and 6) |
| Cloudinary account | https://cloudinary.com/users/register_free |
| Railway project | already provisioned: `L2-Promotion-Assignment-Yasiru` |
| Generated secrets | `apps/cms/.env.railway` (gitignored, created locally) |

---

## Step 1 — Cloudinary account

1. Sign up at https://cloudinary.com/users/register_free.
2. On the dashboard, open **Product Environment Credentials**.
3. Copy three values:
   - **Cloud name** → `CLOUDINARY_NAME`
   - **API Key** → `CLOUDINARY_KEY`
   - **API Secret** → `CLOUDINARY_SECRET` (click *Reveal*)
4. Paste them into the blanks in `apps/cms/.env.railway`.

Nothing else to configure — the folder is created automatically on first upload.

---

## Step 2 — GitHub repository

Create an **empty** repository (no README, no .gitignore — the repo already has
both):

1. https://github.com/new
2. Name: `metabase-replica` (or similar)
3. Visibility: **Private** is fine; add the reviewers later
4. Do **not** tick "Add a README file"
5. Create, then copy the SSH or HTTPS URL

Then from the project root:

```bash
git remote add origin <the URL you copied>
git push -u origin main
```

Verify the push landed and that `.env` is **not** in the file list on GitHub.

---

## Step 3 — Postgres on Railway

1. Open the Railway project → environment `production`.
2. **New** → **Database** → **Add PostgreSQL**.
3. Wait for it to provision. The service will be named `Postgres`.

Nothing to configure. Railway exposes `DATABASE_URL` on that service, which the
CMS service references in the next step.

---

## Step 4 — The Strapi service

1. **New** → **GitHub Repository** → authorise Railway if prompted, then pick
   the repo.
2. Railway will start a build that **fails or builds the wrong thing** — this
   is expected until the root directory is set. Let it fail.
3. Open the new service → **Settings**:
   - **Source → Root Directory**: `apps/cms`
   - **Service Name**: `cms` (optional, clearer than the repo name)
4. Railway reads `apps/cms/railway.json` for the build and start commands, so
   there is nothing to type there:
   - build: `npm ci && npm run build`
   - start: `npm run start`
   - healthcheck: `/_health`

---

## Step 5 — Environment variables

Service → **Variables** → **Raw Editor**, and paste the contents of
`apps/cms/.env.railway` (with the Cloudinary blanks filled in).

The database line uses Railway's reference syntax, which resolves at deploy
time to the Postgres service's real connection string:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

If the Postgres service is named something other than `Postgres`, change the
reference to match.

| Variable | Why |
|---|---|
| `APP_KEYS` … `ENCRYPTION_KEY` | Strapi's signing secrets. Must differ from the local ones. |
| `DATABASE_CLIENT=postgres` | switches `config/database.ts` off SQLite |
| `DATABASE_URL` | Railway reference, above |
| `DATABASE_SSL=true` | Railway Postgres requires TLS |
| `NODE_ENV=production` | affects Strapi's build and admin behaviour |
| `CLOUDINARY_*` | switches the upload provider; without these, media would be written to the container's ephemeral disk |
| `FRONTEND_URL` | CORS allow-list; update once the Astro service has a domain |

**Do not** set `PORT` or `HOST`. Railway injects `PORT`, and `config/server.ts`
already reads it with `0.0.0.0` as the host default.

---

## Step 6 — Public domain

Service → **Settings** → **Networking** → **Generate Domain**.

Railway returns something like `cms-production-xxxx.up.railway.app`. Record it;
the Astro build will need it as `STRAPI_URL`.

---

## Step 7 — Deploy and create the admin user

The variable changes trigger a redeploy. Watch **Deployments → View Logs** for:

```
[permissions] granted 22 public read actions
Strapi started successfully
```

The first build takes several minutes — it compiles the admin panel.

Then open `https://<your-domain>/admin` and create the first administrator.
This is a **one-time** form on a fresh database; the account it creates is what
you share with the reviewers.

---

## Step 8 — Verify

```bash
# Health
curl -s -o /dev/null -w '%{http_code}\n' https://<domain>/_health      # 204

# Public read API (empty but reachable)
curl -s https://<domain>/api/posts
# {"data":[],"meta":{"pagination":{...,"total":0}}}

curl -s https://<domain>/api/case-studies
curl -s https://<domain>/api/testimonials
```

Then in the admin:

1. **Content Manager** should list all 11 collection types.
2. Upload an image on any entry and confirm the URL it gets back is on
   `res.cloudinary.com`, **not** a relative `/uploads/...` path. If it is
   relative, the Cloudinary variables are not being read — check for typos and
   redeploy.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Build fails, `npm ci` cannot find package.json | Root Directory is not set to `apps/cms` |
| `error: APP_KEYS is required` | `APP_KEYS` missing, or not comma-separated with at least two values |
| Healthcheck times out | usually the first build exceeding the window; raise `healthcheckTimeout` in `railway.json` or redeploy |
| `self signed certificate` / SSL error from Postgres | `DATABASE_SSL=true` missing |
| Images 404 after a redeploy | Cloudinary variables not set — media went to the ephemeral container disk |
| Admin loads but CSS is broken | CSP blocking; `config/middlewares.ts` already allows `res.cloudinary.com` |
| CORS error from the Astro site | add the Astro domain to `FRONTEND_URL` / `CORS_ORIGINS` |

---

## After this

- Seed content through the admin
- Deploy the Astro front end as a second Railway service from the same repo,
  with Root Directory `apps/web`
- Set `FRONTEND_URL` on the CMS to the Astro domain
- Give the reviewers access to the GitHub repo and the Strapi admin
