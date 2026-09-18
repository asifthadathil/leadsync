import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

const CLAUDE_VISION_MODEL = process.env.CLAUDE_VISION_MODEL || 'claude-haiku-4-5';

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

function isAllowedMediaType(value: string): value is AllowedMediaType {
  return (ALLOWED_MEDIA_TYPES as readonly string[]).includes(value);
}

const ScannedCardSchema = z.object({
  fullName: z.string(),
  companyName: z.string(),
  position: z.string(),
  website: z.string(),
  email: z.string(),
  mobileNumber: z.string(),
  telephoneNumber: z.string(),
  address: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Business card scanning is not configured (missing ANTHROPIC_API_KEY).' },
        { status: 500 }
      );
    }

    const { image } = await request.json();
    if (!image || typeof image !== 'string') {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    const match = image.match(/^data:([^;]+);base64,(.+)$/);
    const mediaType = match?.[1];
    const base64Data = match?.[2];
    if (!mediaType || !base64Data || !isAllowedMediaType(mediaType)) {
      return NextResponse.json({ success: false, error: 'Unsupported image format' }, { status: 400 });
    }

    const client = new Anthropic();

    const response = await client.messages.parse({
      model: CLAUDE_VISION_MODEL,
      max_tokens: 1024,
      system:
        'You extract contact details from a photo of a business card. Use "" for any field you cannot find on the card. Do not guess or invent information that is not printed on the card. If the card lists a mobile/cell number, put it in mobileNumber; put an office/landline number in telephoneNumber; if only one phone number is present, put it in telephoneNumber and leave mobileNumber empty. Combine street, postal code, city and country into a single address string.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Data },
            },
            { type: 'text', text: 'Extract the contact details from this business card image.' },
          ],
        },
      ],
      output_config: {
        format: zodOutputFormat(ScannedCardSchema),
      },
    });

    if (!response.parsed_output) {
      throw new Error('Failed to parse structured output from Claude');
    }

    return NextResponse.json({ success: true, fields: response.parsed_output });
  } catch (error: any) {
    console.error('Card scan error:', error.message || error);
    return NextResponse.json(
      { success: false, error: 'Failed to scan business card. Check server logs.' },
      { status: 500 }
    );
  }
}
