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
   - build: `npm run build`  (Nixpacks installs dependencies itself)
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
| `DATABASE_SSL` | see below |
| `NODE_ENV=production` | affects Strapi's build and admin behaviour |
| `CLOUDINARY_*` | switches the upload provider; without these, media would be written to the container's ephemeral disk |
| `FRONTEND_URL` | CORS allow-list; update once the Astro service has a domain |

### Postgres TLS — pick one

Railway's managed Postgres presents a **self-signed certificate**. Node rejects
it by default, and Strapi exits on boot with:

```
error: self-signed certificate in certificate chain
```

Check the host in the Postgres service's `DATABASE_URL` and set variables to
match:

| `DATABASE_URL` host | Connection | Set |
|---|---|---|
| `postgres.railway.internal` | private network, never leaves Railway | `DATABASE_SSL=false` |
| `*.proxy.rlwy.net` | public proxy | `DATABASE_SSL=true` **and** `DATABASE_SSL_REJECT_UNAUTHORIZED=false` |

Prefer the private network. It keeps database traffic inside Railway and avoids
disabling certificate verification at all — which is the better answer if
anyone asks why verification is off.

`config/database.ts` already reads both variables, so neither option needs a
code change.

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

## Step 7b — Seed the content

The seed script runs from your machine against the Railway database. Use the
Railway CLI's encrypted tunnel rather than exposing the database publicly.

```bash
brew install railway
railway login
railway link --project <project id> --environment production --service Postgres
railway ssh keys add --key ~/.ssh/<your key>.pub --name <machine>
railway connect Postgres --tunnel-only      # leave running; prints host/port/creds
```

The tunnel needs an SSH key registered to your Railway account, and it allocates
a **new local port each time**, so `.env.seed` has to be rebuilt per session.
Point `DATABASE_URL` at `127.0.0.1:<port>` with `DATABASE_SSL=false` — the hop to
localhost is already inside the tunnel.

**The tunnel can drop on a long run.** Ours died after about 35 minutes with
`Client has encountered a connection error and is not queryable`, roughly 59
posts in. Because the seed is idempotent, reopening the tunnel, rebuilding
`.env.seed` with the new port and re-running picked up exactly where it stopped.
Budget around 45 minutes: Strapi generates responsive variants per image, so 136
source images become several hundred Cloudinary uploads.

### Public access, if the CLI is unavailable

Needs a TCP proxy, which Railway only adds on request.

1. **Postgres → Settings → Networking → Public Networking → Add TCP Proxy**,
   target port `5432`.
2. Copy `DATABASE_PUBLIC_URL` from the Postgres service's Variables. If it is
   not listed, build it from the other variables there — using the **proxy**
   domain and port, not `PGHOST`/`PGPORT`:
   `postgresql://<PGUSER>:<PGPASSWORD>@<RAILWAY_TCP_PROXY_DOMAIN>:<RAILWAY_TCP_PROXY_PORT>/<PGDATABASE>`
3. Fill in `apps/cms/.env.seed` (copy from `.env.seed.example`; gitignored).
4. Run it:

```bash
cd apps/cms
set -a && . ./.env.seed && set +a && npm run seed
```

5. **Turn the TCP proxy back off.** Nothing needs it after this.

The Cloudinary variables in that file are not optional. The seed uploads 136
images through whichever provider the local environment points at; without
them, images are written to your own disk while the production database records
paths that do not exist there, and every image 404s on the live site.

`npm run seed` is additive and idempotent — it will not touch the admin user,
and re-running skips anything already present. `npm run seed:fresh` deletes
seeded content first and is not what you want against production.

### Alternative: seed inside Railway

Avoids exposing the database at all, and reuses the Cloudinary variables
already set on the service. CMS service → Settings → Deploy → Custom Start
Command:

```
npm run seed ; npm run start
```

Redeploy, watch for `Seed complete`, then clear the custom start command. The
`;` rather than `&&` means the service still starts if seeding fails. Caveat:
production installs with `--omit=dev`, so the TypeScript compiler the seed's
`compileStrapi()` may need might be absent. Untested — the TCP proxy route runs
on a machine where the toolchain is known good.

---

## Step 9 — The Astro front end

A second Railway service from the same repository.

1. **New → GitHub Repository**, pick the same repo.
2. **Settings → Source → Root Directory**: `apps/web`
3. **Settings → Networking → Generate Domain**
4. **Variables**:

| Variable | Value |
|---|---|
| `STRAPI_URL` | `https://<your cms domain>` — the **public** URL |
| `SITE_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |

`apps/web/railway.json` supplies the build and start commands.

### Why the public Strapi URL, not the private one

Astro reads `STRAPI_URL` during `astro build`, and Railway's private network is
only available at runtime — not in the build container. Pointing it at
`*.railway.internal` fails with `fetch failed`. Leaving it unset fails the same
way, because the client falls back to `localhost:1337`:

```
Strapi unreachable at http://localhost:1337 after 4 attempts
```

The traffic is a handful of API calls per build, so the egress is negligible.

### Serving the build

A static Astro build has no server, so `apps/web/server.mjs` provides one. It
exists rather than a one-line CLI because the cache headers matter: everything
under `/_astro` is fingerprinted and served `immutable` for a year, while HTML
must revalidate so a deploy actually reaches people.

### Then point CORS back at it

On the **CMS** service, set `FRONTEND_URL` to the Astro domain so browser
requests from the site are allowed.

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
| `EBUSY: resource busy or locked, rmdir '/app/node_modules/.cache'` | the build command ran `npm ci` a second time. Nixpacks already installs dependencies, and its cache is mounted inside `node_modules`, so a reinstall cannot remove it. The build command must be `npm run build` alone. |
| `error: APP_KEYS is required` | `APP_KEYS` missing, or not comma-separated with at least two values |
| Healthcheck times out | usually the first build exceeding the window; raise `healthcheckTimeout` in `railway.json` or redeploy |
| `self-signed certificate in certificate chain`, Strapi restart-looping | Railway Postgres uses a self-signed cert. Set `DATABASE_SSL=false` on the private network, or `DATABASE_SSL_REJECT_UNAUTHORIZED=false` on the public proxy. See *Postgres TLS* above. |
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
