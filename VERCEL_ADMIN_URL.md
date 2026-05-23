# Admin URL sa Vercel (Tagalog)

## Bakit `404 DEPLOYMENT_NOT_FOUND`?

Ang URL na **`harvcioushacks.admin.vercel.app`** (may **dot** bago ang vercel) ay **hindi automatic** na ginagawa ng Vercel. Kung hindi mo ito idinagdag sa **Domains**, walang deployment na nakakabit → **404 NOT_FOUND**.

Gamitin ang format na may **gitling (-)**:
```
https://harvcioushacks-admin.vercel.app
```

---

## Step-by-step (5 minuto)

### 1. Buksan ang project sa Vercel
- [vercel.com/dashboard](https://vercel.com/dashboard)
- Piliin ang **harvcioushacks** project

### 2. Idagdag ang admin domain
1. **Settings** → **Domains**
2. Sa "Add Domain", i-type:
   ```
   harvcioushacks-admin.vercel.app
   ```
3. Click **Add**
4. Hintayin ang **Valid** (green check) — kadalasan instant

Kung "already taken", subukan:
- `harvcioushacks-admin-ceoharvey.vercel.app`
- `hh-admin.vercel.app`

Gamitin ang **eksaktong** domain na nakuha mo sa susunod na steps.

### 3. Environment variables
**Settings** → **Environment Variables** → i-edit o idagdag:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_ADMIN_URL` | `https://HARVCIOUSHACKS-ADMIN-DOMAIN-MO.vercel.app` |
| `ADMIN_HOSTS` | `harvcioushacks-admin.vercel.app` (same hostname, walang https) |
| `ADMIN_PASSWORD` | password mo |

Apply sa **Production**, **Preview**, at **Development**.

### 4. Blob storage (kung wala pa)
**Storage** → **Blob** → **Connect to Project** → **Redeploy**

### 5. Redeploy
**Deployments** → pinaka-latest → **⋯** → **Redeploy**

---

## Paano i-test

| URL | Dapat mangyari |
|-----|----------------|
| `https://harvcioushacks.vercel.app` | Store (home) — OK |
| `https://harvcioushacks.vercel.app/admin` | Redirect sa home (normal) |
| `https://harvcioushacks-admin.vercel.app` | Admin login — OK |

---

## Mali vs tama

| Mali | Tama |
|------|------|
| `harvcioushacks.admin.vercel.app` | `harvcioushacks-admin.vercel.app` |
| Hindi idinagdag sa Vercel Domains | Naka-add at **Valid** sa Domains |
| Mali ang `ADMIN_HOSTS` | Same spelling sa Domains tab |

---

## Main site URL

Sa **Domains**, makikita mo rin ang:
```
harvcioushacks.vercel.app
```
Yan ang para sa customers. Ang admin ay **hiwalay na domain** sa same project.
