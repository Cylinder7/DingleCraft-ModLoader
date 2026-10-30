# Hosting the DingleMod Launcher on Render

This guide gets the launcher (the Modrinth-style DingleMod site + the bundled
42 MB DINGLECRAFT game) running on [render.com](https://render.com) for free.

There are two things you might want to host — pick what you need:

| What | Service type | Cost |
| --- | --- | --- |
| **The full launcher** (mod catalog, uploads, AI Forge, modded launch) | Web Service (Node) | Free tier works |
| **Just the game file** (a public URL that always serves `DINGLECRAFT.html`) | Static Site | Free tier works |

---

## Option A — The full launcher (recommended)

### 1. Push the project to GitHub

The whole project — **including `public/game/DINGLECRAFT.html` (~42 MB)** — must
be in the repo. The file is under GitHub's 100 MB per-file limit, so a normal
commit works:

```bash
git add public/game/DINGLECRAFT.html render.yaml DEPLOY-RENDER.md
git commit -m "bundle game + render config"
git push
```

> Tip: if the 42 MB commit is too slow for you, GitHub Git LFS also works
> (`git lfs track "public/game/*.html"`), but a plain commit is simpler and
> Render handles it fine.

### 2. Create the service on Render

The repo includes a **Render Blueprint** (`render.yaml`), so the easiest path is:

1. Render dashboard → **New +** → **Blueprint**
2. Select your repository — Render reads `render.yaml` and pre-fills everything
3. Click **Apply** — done.

Prefer doing it by hand? **New +** → **Web Service** → connect the repo, then:

| Setting | Value |
| --- | --- |
| Runtime | **Node** |
| Build command | `npm install --include=dev && npx prisma generate && npm run build` |
| Start command | `npx prisma db push --skip-generate --accept-data-loss && node .next/standalone/server.js` |
| Instance type | Free |

And set these environment variables:

| Variable | Value | Why |
| --- | --- | --- |
| `NODE_ENV` | `production` | standard |
| `HOSTNAME` | `0.0.0.0` | so the standalone server accepts Render's port forwarding |
| `DATABASE_URL` | `file:/tmp/dinglecraft.db` | SQLite location (see persistence below) |

(`PORT` is injected by Render automatically — the Next.js standalone server
picks it up.)

### 3. What the commands do

- **Build**: installs dependencies (including dev deps, needed for
  `typescript`), generates the Prisma client, and runs `next build`. The
  project's build script already bundles `public/` (the game file) into the
  standalone output.
- **Start**: `prisma db push` creates/migrates the SQLite schema (idempotent —
  safe on every boot), then starts the server. On the first request the app
  seeds the official mod catalog automatically.

### 4. The free-tier caveat: the database is ephemeral

Render's free instances have an **ephemeral filesystem**. `/tmp` (and anything
outside a mounted disk) is wiped whenever the service restarts or redeploys —
roughly daily on the free plan. In practice:

- The official mod catalog **re-seeds itself automatically** — nothing to do.
- **Community mods uploaded through the site are lost on restart.** Fine for
  demos; not fine if people rely on it.

To make uploads persistent, attach a **Disk** (requires a paid instance,
~$7/mo starter):

1. Render dashboard → your service → **Disks** → **Add Disk**
   - Mount path: `/var/data`
   - Size: 1 GB is plenty
2. Change the `DATABASE_URL` env var to `file:/var/data/dinglecraft.db`
3. Redeploy. Uploaded mods now survive restarts and deploys.

Alternatively, point Prisma at a free external Postgres (e.g. Neon) — change
`provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`,
set `DATABASE_URL` to the Postgres URL, and run `npx prisma db push` once.

### 5. Verify it works

- `https://<your-service>.onrender.com/` → the launcher UI loads and shows the
  mod catalog (seeded on first API request).
- Click **Launcher** → the game card says *"DINGLECRAFT v6.9 · bundled · ✓ ready"*.
- Install a mod or two → **LAUNCH MODDED GAME** → the 42 MB fetch streams with
  a progress bar, then the modded game opens in a new tab.
- In game: `E` opens the inventory — modded items (Poop, Clifford Spawn Egg,
  Blessed Salt) are at the **end of the palette**, and the QOL mod's search box
  sits above it. `/dm` opens the DingleMod console.

---

## Option B — Host just the game (static)

If all you want is a public link to the game itself:

1. Render dashboard → **New +** → **Static Site**
2. Connect the repository.
3. Build command: *(leave empty)*
4. Publish directory: `public`
5. Create.

The game is then served at `https://<your-site>.onrender.com/game/DINGLECRAFT.html`
(and you can rename the file or add an `index.html` redirect if you want it at
the root). Note: a static site serves the **vanilla** game — no mods, no
launcher. The modded experience requires Option A (the loader is injected in
the browser by the launcher).

---

## Local production test (before pushing)

```bash
npm install --include=dev
npx prisma generate
npm run build
DATABASE_URL=file:/tmp/dinglecraft.db PORT=3000 node .next/standalone/server.js
```

Open `http://localhost:3000` — this is exactly what Render runs.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Build fails at `prisma generate` | Make sure `prisma/schema.prisma` is committed and the build command runs `npx prisma generate`. |
| `Error: DB not found` / 500 on `/api/mods` | The start command must run `npx prisma db push ...` **before** `node .next/standalone/server.js`. |
| Build fails: `Failed to collect page data for /api/mods/...` | Prisma client was never generated before `next build`. This repo prevents it three ways: `postinstall: prisma generate` (runs on every `npm install`), `serverExternalPackages` in `next.config.ts`, and no `bun.lock` in the repo (Render must build with npm, not bun — bun skips these hooks). |
| Game card says "not found" | `public/game/DINGLECRAFT.html` wasn't committed — check the repo (it's ~42 MB; verify your git LFS/push actually included it). |
| Uploaded mods vanished | Expected on the free tier — see §4. |
| Slow first load | The browser fetches 42 MB once per session, then it's cached in memory. Deploying closer to users or enabling a CDN in front of Render helps. |
