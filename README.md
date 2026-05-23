# HarvciousHacks

Modern download site for EXE tools with admin upload, large flexible product images, and one-click auto download.

## Setup (local)

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and set your admin password:

```bash
copy .env.example .env
```

Edit `.env` and set `ADMIN_PASSWORD` to a strong password.

3. Run the dev server:

```bash
npm run dev
```

- **Store (customers):** [http://localhost:3000](http://localhost:3000)
- **Admin (local):** [http://localhost:3000/admin](http://localhost:3000/admin)

## Public site vs admin URL

| Site | URL (example) |
|------|----------------|
| **Store** (tools + download) | `harvcioushacks.vercel.app` |
| **Admin** (upload EXE only) | `harvcioushacks-admin.vercel.app` |

On the **store**, the top bar shows **Contact Admin** (Discord: [@ceoharvey24](https://discord.com/users/1255219127107325955)) — not a link to admin.

On the **admin host**, `/admin` is the panel. Visiting `/` on that host redirects to `/admin`. The store URL **cannot** open `/admin` (redirects home).

## Deploy on Vercel

### 1. Push to GitHub and import on Vercel

1. Create a repo and push this project.
2. [vercel.com/new](https://vercel.com/new) → Import the repo.
3. Framework: **Next.js** (auto-detected).

### 2. Environment variables (Vercel → Settings → Environment Variables)

| Name | Value |
|------|--------|
| `ADMIN_PASSWORD` | Your strong admin password |
| `ADMIN_HOSTS` | `harvcioushacks-admin.vercel.app,harvcioushacks.admin.vercel.app` |
| `NEXT_PUBLIC_ADMIN_URL` | `https://harvcioushacks-admin.vercel.app` |

Deploy once to get the main URL (e.g. `harvcioushacks.vercel.app`).

### 3. Add the admin domain (same project)

1. Vercel project → **Settings** → **Domains**.
2. Add domain: `harvcioushacks-admin.vercel.app`  
   (Vercel may suggest this name when you add a second `.vercel.app` domain to the same project.)
3. If you prefer the name `harvcioushacks.admin.vercel.app`, add that too and include it in `ADMIN_HOSTS`.

Both domains point to **one** deployment; middleware routes by hostname.

### 4. Storage on Vercel (important)

Vercel serverless functions use a **read-only** filesystem. Uploads in `data/` work on your PC but **not** on Vercel unless you add blob storage (e.g. [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)) or an external database.

For a quick test deploy, the UI and admin login work; file uploads need Blob/S3 for production. Use a VPS or Railway if you want disk storage without changing code.

## Usage

- **Home** — Large image, description, features, **Download .exe** (auto-download).
- **Admin host** — Log in, upload EXE + image, publish, delete tools.

## Production (self-hosted)

```bash
npm run build
npm start
```

Set `ADMIN_PASSWORD` and `ADMIN_HOSTS`. Files live in `data/uploads/` and `data/products.json`.
