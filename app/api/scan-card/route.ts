import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';

interface ScannedFields {
  fullName: string;
  companyName: string;
  position: string;
  website: string;
  email: string;
  mobileNumber: string;
  telephoneNumber: string;
  address: string;
}

const FIELD_KEYS: (keyof ScannedFields)[] = [
  'fullName',
  'companyName',
  'position',
  'website',
  'email',
  'mobileNumber',
  'telephoneNumber',
  'address',
];

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Business card scanning is not configured (missing OPENAI_API_KEY).' },
        { status: 500 }
      );
    }

    const { image } = await request.json();
    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_VISION_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You extract contact details from a photo of a business card. Respond with ONLY a JSON object with these exact keys: fullName, companyName, position, website, email, mobileNumber, telephoneNumber, address. Use "" for any field you cannot find on the card. Do not guess or invent information that is not printed on the card. If the card lists a mobile/cell number, put it in mobileNumber; put an office/landline number in telephoneNumber; if only one phone number is present, put it in telephoneNumber and leave mobileNumber empty. Combine street, postal code, city and country into a single address string.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract the contact details from this business card image.' },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = JSON.parse(content);
    const fields = FIELD_KEYS.reduce((acc, key) => {
      const value = parsed[key];
      acc[key] = typeof value === 'string' ? value.trim() : '';
      return acc;
    }, {} as ScannedFields);

    return NextResponse.json({ success: true, fields });
  } catch (error: any) {
    console.error('Card scan error:', error.response?.data || error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to scan business card. Check server logs.' },
      { status: 500 }
    );
  }
}
