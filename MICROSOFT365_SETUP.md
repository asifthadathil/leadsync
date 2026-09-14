# Microsoft 365 / Azure Setup Guide

Follow these steps to configure OAuth for email sending via Microsoft Graph API.

## Step 1: Create Azure App Registration

1. Go to **Azure Portal**: https://portal.azure.com
2. Sign in with your iDTRONIC Microsoft 365 account
3. Search for **App registrations** → Click **New registration**
4. Fill in:
   - **Name**: `LeadSync Email Service`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: Leave blank for now
5. Click **Register**

## Step 2: Generate Client Secret

1. In app registration page, go to **Certificates & secrets** (left sidebar)
2. Click **New client secret**
3. Fill in:
   - **Description**: `LeadSync Email`
   - **Expires**: `24 months`
4. Click **Add**
5. **Copy the secret value immediately** (you won't see it again)
   - Save as: `AZURE_CLIENT_SECRET`

## Step 3: Get Tenant ID & Client ID

1. Go to **Overview** tab
2. Copy:
   - **Application (client) ID** → Save as: `NEXT_PUBLIC_AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → Save as: `NEXT_PUBLIC_AZURE_TENANT_ID`

## Step 4: Grant API Permissions

1. Go to **API permissions** (left sidebar)
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Application permissions** (not Delegated)
5. Search for and select:
   - `Mail.Send`
6. Click **Add permissions**
7. Click **Grant admin consent for [Your Organization]**
   - Accept the confirmation

## Step 5: Configure Sender Email

1. In Vercel environment variables (see deployment guide), set:
   - `SENDER_EMAIL`: Your Office 365 email (e.g., `leads@idtronic.de`)
   - This must be a mailbox that exists in your Office 365 tenant
   - OR use a shared mailbox/service account

**Note**: If using personal account, ensure mail permissions are set correctly.

## Step 6: Verify Email Configuration

Before deploying:
1. Confirm all 3 credentials in `.env.local`:
   ```
   NEXT_PUBLIC_AZURE_TENANT_ID=your_value
   NEXT_PUBLIC_AZURE_CLIENT_ID=your_value
   AZURE_CLIENT_SECRET=your_value
   SENDER_EMAIL=your_email@idtronic.de
   ```

2. Test locally:
   ```bash
   npm run dev
   # Fill form and submit
   # Check if email arrives
   ```

---

## Troubleshooting

### "Invalid credentials" error
- Verify `AZURE_CLIENT_SECRET` is exact (includes all characters)
- Check `NEXT_PUBLIC_AZURE_TENANT_ID` is correct

### "Mail.Send permission required"
- Go to API permissions → check if `Mail.Send` is listed
- Grant admin consent again

### Email sent but not received
- Check junk/spam folder
- Verify `SENDER_EMAIL` exists and has permissions
- Check Vercel function logs for errors

---

## Next: Deploy to Vercel

See `DEPLOYMENT.md` for Vercel setup.
