import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface FormData {
  fullName: string;
  companyName: string;
  email: string;
  mobileNumber: string;
  inquiryCategory: string;
  productName: string;
  qty: string;
  customerQuery: string;
  nextStep: string;
}

interface RequestBody {
  formData: FormData;
  eventName: string;
  timestamp: string;
}

const AZURE_TENANT_ID = process.env.NEXT_PUBLIC_AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const SENDER_EMAIL = process.env.SENDER_EMAIL;

// Email routing map
const EMAIL_ROUTES: { [key: string]: string[] } = {
  Smart: [
    process.env.SMART_EMAIL || 'andreas.jaeger@idtronic.de',
    process.env.SUPPORT_EMAIL || 'support@idtronic.de',
  ],
  Professional: [
    process.env.PROFESSIONAL_EMAIL || 'benjamin.pfeiffer@idtronic.de',
    process.env.SUPPORT_EMAIL || 'support@idtronic.de',
  ],
  IoT: [
    process.env.IOT_EMAIL || 'luca.mack@idtronic.de',
    process.env.SUPPORT_EMAIL || 'support@idtronic.de',
  ],
  'RFID Tag/Labels': [
    process.env.RFID_EMAIL || 'roger.kochendoerfer@idtronic.de',
    process.env.SUPPORT_EMAIL || 'support@idtronic.de',
  ],
};

async function getAccessToken(): Promise<string> {
  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: AZURE_CLIENT_ID || '',
        client_secret: AZURE_CLIENT_SECRET || '',
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  } catch (error: any) {
    console.error('Access token error:', error.response?.data || error.message);
    throw new Error('Failed to get Microsoft Graph access token');
  }
}

function buildEmailBody(formData: FormData, eventName: string, timestamp: string): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #1a2333; margin: 0; }
          .wrapper { max-width: 600px; margin: 0 auto; }
          .header { background: #1e3a6f; color: white; padding: 28px 24px; border-radius: 10px 10px 0 0; }
          .logo { display: inline-flex; align-items: center; padding: 8px 16px; border: 2px solid #ffffff; border-radius: 8px; font-weight: 800; font-size: 18px; }
          .logo-mark { color: #f39200; }
          .logo-word { color: #ffffff; margin-left: 4px; }
          .doc-title { margin: 14px 0 0; font-size: 18px; font-weight: 700; }
          .doc-sub { margin: 4px 0 0; font-size: 13px; color: #cbd5e1; }
          .body-content { background: #ffffff; padding: 24px; border: 1px solid #e5e8ee; border-top: none; border-radius: 0 0 10px 10px; }
          .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #f39200; margin: 0 0 10px; }
          table { width: 100%; border-collapse: collapse; margin: 0 0 22px; }
          td { padding: 11px 12px; border-bottom: 1px solid #e5e8ee; font-size: 14px; }
          .label { font-weight: 700; color: #1e3a6f; width: 32%; background: #f7f9fc; }
          .footer { font-size: 11px; color: #99a2b3; text-align: center; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <div class="logo"><span class="logo-mark">iD</span><span class="logo-word">TRONIC</span></div>
            <p class="doc-title">New Lead &mdash; ${eventName}</p>
            <p class="doc-sub">Submitted ${timestamp}</p>
          </div>

          <div class="body-content">
            <p class="section-title">Customer Contact Information</p>
            <table>
              <tr><td class="label">Full Name</td><td>${formData.fullName || '—'}</td></tr>
              <tr><td class="label">Company</td><td>${formData.companyName || '—'}</td></tr>
              <tr><td class="label">Email</td><td>${formData.email || '—'}</td></tr>
              <tr><td class="label">Mobile</td><td>${formData.mobileNumber || '—'}</td></tr>
            </table>

            <p class="section-title">Inquiry</p>
            <table>
              <tr><td class="label">Category</td><td>${formData.inquiryCategory || '—'}</td></tr>
              <tr><td class="label">Product Name</td><td>${formData.productName || '—'}</td></tr>
              <tr><td class="label">Qty</td><td>${formData.qty || '—'}</td></tr>
              <tr><td class="label" style="vertical-align: top;">Customer Query</td><td style="white-space: pre-wrap;">${formData.customerQuery || '—'}</td></tr>
              <tr><td class="label">Next Step</td><td>${formData.nextStep || '—'}</td></tr>
            </table>
          </div>

          <p class="footer">iDTRONIC GmbH &middot; Automatically generated by LeadSync &middot; Do not reply to this email</p>
        </div>
      </body>
    </html>
  `;
}

async function sendEmailViaGraphAPI(
  accessToken: string,
  toEmails: string[],
  formData: FormData,
  eventName: string,
  timestamp: string
): Promise<boolean> {
  try {
    const emailBody = buildEmailBody(formData, eventName, timestamp);

    const emailMessage = {
      message: {
        subject: `LeadSync: New Lead - ${formData.fullName} (${formData.inquiryCategory}) - ${eventName}`,
        body: {
          contentType: 'HTML',
          content: emailBody,
        },
        toRecipients: toEmails.map((email) => ({
          emailAddress: {
            address: email,
          },
        })),
        replyTo: formData.email ? [{ emailAddress: { address: formData.email } }] : [],
      },
      saveToSentItems: true,
    };

    const response = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(SENDER_EMAIL || '')}/sendMail`,
      emailMessage,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.status === 202; // 202 Accepted
  } catch (error: any) {
    console.error('Send email error:', error.response?.data || error.message);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { formData, eventName, timestamp } = body;

    // Validate required fields
    if (!formData.inquiryCategory) {
      return NextResponse.json(
        { success: false, error: 'Inquiry category required' },
        { status: 400 }
      );
    }

    // Get recipient emails
    const recipients = EMAIL_ROUTES[formData.inquiryCategory] || [
      process.env.SUPPORT_EMAIL || 'support@idtronic.de',
    ];

    if (!recipients.length) {
      return NextResponse.json(
        { success: false, error: 'No recipients configured for category' },
        { status: 500 }
      );
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Send email
    const emailSent = await sendEmailViaGraphAPI(
      accessToken,
      recipients,
      formData,
      eventName,
      timestamp
    );

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        recipients,
      });
    } else {
      throw new Error('Email send returned unexpected status');
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send email. Check server logs.',
      },
      { status: 500 }
    );
  }
}
