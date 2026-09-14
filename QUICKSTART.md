# LeadSync Quick Start (20 minutes)

Complete deployment in 3 phases.

---

## Phase 1: Azure Setup (5 min)

**Do this first** before deploying.

1. Open: https://portal.azure.com
2. Search: **App registrations** → **New registration**
3. Name: `LeadSync Email Service`
4. Register → Copy **Application ID** (save as `NEXT_PUBLIC_AZURE_CLIENT_ID`)
5. Copy **Directory ID** (save as `NEXT_PUBLIC_AZURE_TENANT_ID`)
6. Go to: **Certificates & secrets** → **New client secret**
7. Copy secret value (save as `AZURE_CLIENT_SECRET`)
8. Go to: **API permissions** → **Add a permission**
9. Select: **Microsoft Graph** → **Application permissions**
10. Search: `Mail.Send` → Add it
11. Click: **Grant admin consent**

**Result**: 3 values ready
- `NEXT_PUBLIC_AZURE_TENANT_ID`
- `NEXT_PUBLIC_AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`

---

## Phase 2: GitHub Setup (5 min)

1. Create new GitHub repo: `leadsync`
2. Clone locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/leadsync.git
   cd leadsync
   ```

3. Copy **all files** from this project into the folder
4. Push to GitHub:
   ```bash
   git add .
   git commit -m "LeadSync initial setup"
   git push origin main
   ```

---

## Phase 3: Vercel Deploy (10 min)

1. Go to: https://vercel.com/new?teamSlug=i-dtronic
2. Click: **Import Project**
3. Paste GitHub URL: `https://github.com/YOUR-USERNAME/leadsync`
4. Click: **Continue**
5. In **Environment Variables**, paste all these:

```
NEXT_PUBLIC_AZURE_TENANT_ID=<from Phase 1>
NEXT_PUBLIC_AZURE_CLIENT_ID=<from Phase 1>
AZURE_CLIENT_SECRET=<from Phase 1>
SENDER_EMAIL=<your Office365 email>

SMART_EMAIL=andreas.jaeger@idtronic.de
PROFESSIONAL_EMAIL=benjamin.pfeiffer@idtronic.de
IOT_EMAIL=luca.mack@idtronic.de
RFID_EMAIL=roger.kochendoerfer@idtronic.de
SUPPORT_EMAIL=support@idtronic.de

NEXT_PUBLIC_APP_NAME=iDTRONIC LeadSync
NEXT_PUBLIC_TIMEZONE=Europe/Berlin
```

6. Click: **Deploy**
7. Wait ~2 min for build
8. Copy Vercel URL (e.g., `https://leadsync-xxx.vercel.app`)

---

## Test It

1. Open Vercel URL
2. Enter event name: `TestEvent`
3. Fill form (use your email for testing)
4. Select category: `Smart`
5. Click: **Submit & Send Email**
6. Check: Email should arrive at `andreas.jaeger@idtronic.de` + `support@idtronic.de`

---

## Done!

Live URL: `https://leadsync-XXX.vercel.app`

Share this link with sales team. No login needed.

---

## Docs for Reference

- **Detailed Microsoft 365 setup**: `MICROSOFT365_SETUP.md`
- **Full deployment guide**: `DEPLOYMENT.md`
- **Project README**: `README.md`
- **Environment template**: `.env.example`
