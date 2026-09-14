# iDTRONIC LeadSync

Event lead capture webapp. Zero login. Email routing to salesmen. Auto PDF generation.

## Features

✅ **No login required** — instant form access  
✅ **Auto-routing** — inquiry category → right salesman email  
✅ **PDF generation** — auto-creates PDF on submit  
✅ **Email sending** — Microsoft 365 integration via Graph API  
✅ **Error handling** — PDF download fallback if email fails  
✅ **Event persistence** — event name saved in browser  
✅ **Berlin timezone** — all timestamps in Europe/Berlin  
✅ **Responsive design** — mobile-friendly form  

## Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript
- **PDF**: jsPDF + html2canvas
- **Email**: Microsoft Graph API (OAuth)
- **Hosting**: Vercel
- **Styling**: CSS-in-JS (no frameworks needed)

## Quick Start

### Local Development

```bash
# 1. Clone repo
git clone https://github.com/YOUR-USERNAME/leadsync.git
cd leadsync

# 2. Install dependencies
npm install

# 3. Create .env.local (copy from .env.example)
cp .env.example .env.local

# 4. Add Microsoft 365 credentials
# Follow: MICROSOFT365_SETUP.md

# 5. Run dev server
npm run dev

# 6. Open: http://localhost:3000
```

### Deploy to Vercel

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial LeadSync setup"
git push origin main

# 2. Deploy to Vercel
# Follow: DEPLOYMENT.md
```

## Setup Docs

- **Microsoft 365 OAuth**: `MICROSOFT365_SETUP.md`
- **Vercel Deployment**: `DEPLOYMENT.md`
- **Environment Variables**: `.env.example`

## Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Event Name | text | YES | Stored in browser localStorage |
| First Name | text | No | |
| Last Name | text | No | |
| Company Name | text | No | |
| Email | email | No | |
| Mobile Number | tel | No | |
| Country | text | No | |
| Location | text | No | |
| Inquiry Category | select | YES | Smart / Professional / IoT / RFID Tag/Labels |

## Email Routing

Category → Recipients:

| Category | Primary | Support |
|----------|---------|---------|
| Smart | andreas.jaeger@idtronic.de | support@idtronic.de |
| Professional | benjamin.pfeiffer@idtronic.de | support@idtronic.de |
| IoT | luca.mack@idtronic.de | support@idtronic.de |
| RFID Tag/Labels | roger.kochendoerfer@idtronic.de | support@idtronic.de |

**All emails also go to**: `support@idtronic.de` (always CC'd)

## Environment Variables

```bash
# Microsoft 365 (from Azure portal)
NEXT_PUBLIC_AZURE_TENANT_ID=xxx
NEXT_PUBLIC_AZURE_CLIENT_ID=xxx
AZURE_CLIENT_SECRET=xxx
SENDER_EMAIL=your-office365@idtronic.de

# Email routing
SMART_EMAIL=andreas.jaeger@idtronic.de
PROFESSIONAL_EMAIL=benjamin.pfeiffer@idtronic.de
IOT_EMAIL=luca.mack@idtronic.de
RFID_EMAIL=roger.kochendoerfer@idtronic.de
SUPPORT_EMAIL=support@idtronic.de

# App settings
NEXT_PUBLIC_APP_NAME=iDTRONIC LeadSync
NEXT_PUBLIC_TIMEZONE=Europe/Berlin
```

## How It Works

1. **User opens form** → Event name from localStorage (or empty)
2. **User fills form** → Any fields optional except category
3. **User clicks Submit** → Form validates category
4. **PDF generated** → jsPDF creates styled PDF table
5. **Email sent** → Via Microsoft Graph API to relevant salesmen
6. **Success**: Form resets after 2 seconds
7. **Failure**: Shows download PDF button, blocks form until PDF downloaded

## File Structure

```
leadsync/
├── app/
│   ├── api/
│   │   └── send-email/
│   │       └── route.ts          # Microsoft Graph email API
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main form + PDF gen
│   └── globals.css               # iDTRONIC branding
├── public/                        # Static assets
├── .env.example                  # Env var template
├── MICROSOFT365_SETUP.md         # OAuth setup guide
├── DEPLOYMENT.md                 # Vercel deployment
├── package.json
├── tsconfig.json
└── next.config.js
```

## Styling

- **Brand colors**: Navy (#1e3a6f) + Orange (#f39200)
- **Responsive**: Mobile-first, works on all devices
- **Accessibility**: ARIA labels, semantic HTML

## PDF Output

Generated PDF includes:
- iDTRONIC branding
- All form data in table format
- Event name + timestamp
- Filename: `LeadSync_[EventName]_[Date].pdf`

## Timezone

All timestamps in **Europe/Berlin** (UTC+2 / UTC+1 depending on DST).

## Troubleshooting

### Email not sending?
1. Check Microsoft 365 credentials in Vercel env vars
2. Verify `Mail.Send` permission granted in Azure portal
3. Check Vercel function logs for errors
4. See: `MICROSOFT365_SETUP.md` troubleshooting section

### Form not loading?
1. Check browser console for errors
2. Verify Next.js deployment succeeded
3. Check Vercel build logs

### PDF download not working?
1. Check browser console
2. Verify jsPDF installed: `npm list jspdf`
3. Try different browser

## Development

```bash
# Dev server
npm run dev

# Build
npm run build

# Production start
npm start

# Lint
npm run lint
```

## Support

For issues or feature requests, contact: support@idtronic.de

---

Built with ❤️ for iDTRONIC GmbH
