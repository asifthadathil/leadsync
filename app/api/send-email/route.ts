import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface FormData {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  mobileNumber: string;
  country: string;
  location: string;
  inquiryCategory: string;
  customerQuery: string;
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
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a6f 0%, #f39200 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          td { padding: 12px; border: 1px solid #e0e0e0; }
          .label { font-weight: bold; background: #f5f5f5; width: 30%; }
          .footer { font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">iDTRONIC LeadSync</h1>
            <p style="margin: 5px 0 0 0;">New Lead Submission</p>
          </div>

          <table>
            <tr><td class="label">Event Name</td><td>${eventName}</td></tr>
            <tr><td class="label">First Name</td><td>${formData.firstName}</td></tr>
            <tr><td class="label">Last Name</td><td>${formData.lastName}</td></tr>
            <tr><td class="label">Company Name</td><td>${formData.companyName}</td></tr>
            <tr><td class="label">Email</td><td>${formData.email}</td></tr>
            <tr><td class="label">Mobile Number</td><td>${formData.mobileNumber}</td></tr>
            <tr><td class="label">Country</td><td>${formData.country}</td></tr>
            <tr><td class="label">Location</td><td>${formData.location}</td></tr>
            <tr><td class="label">Inquiry Category</td><td>${formData.inquiryCategory}</td></tr>
            <tr><td class="label">Customer Query</td><td style="white-space: pre-wrap;">${formData.customerQuery}</td></tr>
            <tr><td class="label">Submitted</td><td>${timestamp}</td></tr>
          </table>

          <div class="footer">
            <p>This is an automated email from iDTRONIC LeadSync system.</p>
            <p>Do not reply to this email.</p>
          </div>
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
        subject: `LeadSync: New Lead - ${formData.firstName} ${formData.lastName} (${formData.inquiryCategory}) - ${eventName}`,
        body: {
          contentType: 'HTML',
          content: emailBody,
        },
        toRecipients: toEmails.map((email) => ({
          emailAddress: {
            address: email,
          },
        })),
        replyToAddresses: formData.email ? [{ emailAddress: { address: formData.email } }] : [],
      },
      saveToSentItems: true,
    };

    const response = await axios.post(
      'https://graph.microsoft.com/v1.0/me/sendMail',
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
