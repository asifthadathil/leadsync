# Vercel Deployment Guide

Deploy LeadSync to Vercel in 5 minutes.

## Step 1: Prepare GitHub Repo

1. Create GitHub repo: `https://github.com/YOUR-USERNAME/leadsync`
2. Clone locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/leadsync.git
   cd leadsync
   ```

3. Copy all files from this project into the repo
4. Commit & push:
   ```bash
   git add .
   git commit -m "Initial LeadSync setup"
   git push origin main
   ```

## Step 2: Connect to Vercel

1. Go to: https://vercel.com/new?teamSlug=i-dtronic
2. Click **Import Project**
3. Paste GitHub repo URL: `https://github.com/YOUR-USERNAME/leadsync`
4. Click **Continue**

## Step 3: Configure Environment Variables

In Vercel dashboard, add these environment variables:

```
NEXT_PUBLIC_AZURE_TENANT_ID=[Your Tenant ID]
NEXT_PUBLIC_AZURE_CLIENT_ID=[Your Client ID]
AZURE_CLIENT_SECRET=[Your Client Secret]
SENDER_EMAIL=[Your Office365 Email]

SMART_EMAIL=andreas.jaeger@idtronic.de
PROFESSIONAL_EMAIL=benjamin.pfeiffer@idtronic.de
IOT_EMAIL=luca.mack@idtronic.de
RFID_EMAIL=roger.kochendoerfer@idtronic.de
SUPPORT_EMAIL=support@idtronic.de

NEXT_PUBLIC_APP_NAME=iDTRONIC LeadSync
NEXT_PUBLIC_TIMEZONE=Europe/Berlin
```

**Get values from**: `MICROSOFT365_SETUP.md` (Steps 1-5)

## Step 4: Deploy

1. Click **Deploy**
2. Wait for build to complete (~2 min)
3. Once done, you'll get a Vercel URL: `https://leadsync-XXXXX.vercel.app`

## Step 5: Test

1. Open your Vercel URL
2. Enter event name
3. Fill form with test data
4. Submit → Check email arrives in recipients' inbox

## Custom Domain (Optional)

1. In Vercel dashboard → **Settings** → **Domains**
2. Add custom domain: `leadsync.idtronic.de`
3. Add DNS records as Vercel instructs
4. Done!

---

## Redeployment After Changes

```bash
# Make changes locally
git add .
git commit -m "Update form fields"
git push origin main

# Vercel auto-deploys on push
# Check Vercel dashboard for deployment status
```

## Environment Variable Updates

After deploying, to update environment variables:
1. Go to Vercel dashboard → Project settings → **Environment Variables**
2. Edit the variable
3. Redeploy: Click **Redeploy** button on Deployments page

---

## Troubleshooting

### Deployment failed
- Check Vercel logs: **Deployments** → **Failed** → **Details**
- Verify all env vars are set
- Ensure GitHub repo is public or Vercel has access

### Form not loading
- Check browser console for errors
- Verify Next.js build succeeded in Vercel logs

### Email not sending
- Check function logs: Vercel dashboard → **Functions** tab
- Verify Microsoft 365 credentials in env vars
- See `MICROSOFT365_SETUP.md` troubleshooting

---

Done! App live at: `https://leadsync-XXXXX.vercel.app`
