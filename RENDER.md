# Deploying Talkspace on Render

This guide outlines the production deployment setup for **Talkspace** on [Render](https://render.com).

Talkspace is structured as an npm workspace monorepo containing:
- `apps/web`: React + Vite SPA frontend
- `apps/server`: Fastify + Socket.IO + Prisma backend
- `packages/shared`: Shared TypeScript types & validation schemas

---

## Deployment Architecture

Render supports deploying the application as two interconnected services:
1. **Web Service** for `apps/server` (Node.js API & WebSockets)
2. **Static Site** for `apps/web` (React Single Page Application)

---

## 1. Deploying the Backend (Web Service)

### Service Details
* **Service Type:** Web Service
* **Name:** `talkspace-server`
* **Environment:** Node
* **Region:** Choose preferred region (e.g., Oregon / Frankfurt)
* **Branch:** `main` (or default branch)
* **Root Directory:** `.` *(leave blank or set to monorepo root)*

### Build & Start Commands
* **Build Command:**
  ```bash
  npm install && npx prisma generate --schema=apps/server/prisma/schema.prisma && npm run build --workspace=packages/shared && npm run build --workspace=apps/server
  ```
* **Start Command:**
  ```bash
  npm run start --workspace=apps/server
  ```

### Environment Variables
Configure the following in Render Web Service Environment Settings:

| Key | Example Value / Description |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` *(Render sets this automatically; app listens on `process.env.PORT`)* |
| `HOST` | `0.0.0.0` |
| `ALLOWED_ORIGIN` | `https://talkspace.online,https://talkspace-web.onrender.com` |
| `DATABASE_URL` | `postgresql://user:pass@ep-xyz.render.com/talkspace_db` *(or PostgreSQL service on Render)* |
| `SESSION_SECRET` | *(Generate a long random secret)* |
| `UPLOAD_DIR` | `./uploads` or `/var/data/uploads` *(if using Render Persistent Disk)* |
| `PUBLIC_SERVER_URL` | `https://talkspace-server.onrender.com` |
| `PUBLIC_WEB_URL` | `https://talkspace.online` |

> **Note on File Uploads & Ephemeral Disk:**
> Render Web Services have ephemeral disks by default. For production image storage persistence across redeploys, attach a Render Persistent Disk mounted at `/var/data/uploads` and set `UPLOAD_DIR=/var/data/uploads`.

---

## 2. Deploying the Frontend (Static Site)

### Service Details
* **Service Type:** Static Site
* **Name:** `talkspace-web`
* **Branch:** `main`
* **Root Directory:** `.`
* **Build Command:**
  ```bash
  npm install && npm run build --workspace=packages/shared && npm run build --workspace=apps/web
  ```
* **Publish Directory:** `apps/web/dist`

### Build-Time Environment Variables
Vite bundles environment variables at build time. Add these in Render Static Site Environment Settings:

| Key | Example Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://talkspace-server.onrender.com/api` (or `https://api.talkspace.online/api`) |
| `VITE_WS_URL` | `https://talkspace-server.onrender.com` (or `https://api.talkspace.online`) |

### Client-Side Routing (SPA Rule)
To ensure room URLs like `/room/roomname` resolve properly on refresh:
1. In Render Dashboard for `talkspace-web`, go to **Redirects / Rewrites**.
2. Add a Rewrite rule:
   - **Source:** `/*`
   - **Target:** `/index.html`
   - **Action:** `Rewrite`

---

## 3. Custom Domain Setup (`https://talkspace.online`)

When pointing your custom domain `talkspace.online` to Render:

1. **Frontend Domain (`https://talkspace.online`)**:
   - In Render Static Site Settings (`talkspace-web`), add custom domain `talkspace.online` and `www.talkspace.online`.
   - Update DNS records with your registrar (CNAME / ANAME / ALIAS) as instructed by Render.

2. **Backend Domain (`https://api.talkspace.online`)**:
   - In Render Web Service Settings (`talkspace-server`), add custom domain `api.talkspace.online`.
   - Update DNS CNAME record for `api` pointing to Render backend URL.

3. **Update Environment Variables**:
   - In `talkspace-server`: set `ALLOWED_ORIGIN=https://talkspace.online`.
   - In `talkspace-web`: set `VITE_API_BASE_URL=https://api.talkspace.online/api` and `VITE_WS_URL=https://api.talkspace.online`. Trigger a rebuild of `talkspace-web`.

---

## 4. Verification Checklist

- [x] Ephemeral room routing preserved at `/room/:roomSlug`
- [x] Dynamic host/port binding on `0.0.0.0` and `process.env.PORT`
- [x] Socket.IO and REST CORS dynamically allow production origins
- [x] Relative API fallback `/api` and origin fallback for proxy/single-domain environments
- [x] Zero hardcoded `localhost` references in client bundle
