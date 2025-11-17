import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const GHL_API_URL = 'https://services.leadconnectorhq.com';
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    return NextResponse.json(
      { error: 'GoHighLevel not configured. Please set GHL_API_KEY and GHL_LOCATION_ID in .env.local' },
      { status: 500 }
    );
  }

  try {
    const authHeader = GHL_API_KEY.startsWith('Bearer ') ? GHL_API_KEY : `Bearer ${GHL_API_KEY}`;

    // Fetch contact details from GHL
    const contactResponse = await fetch(`${GHL_API_URL}/contacts/${params.id}?locationId=${GHL_LOCATION_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Version': '2021-07-28',
      },
    });

    if (!contactResponse.ok) {
      const errorText = await contactResponse.text();
      console.error('GHL API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch contact details', details: errorText },
        { status: contactResponse.status }
      );
    }

           const contactData = await contactResponse.json();
           
           // GHL API returns contact wrapped in { contact: {...}, traceId: "..." }
           const contact = contactData.contact || contactData;
           
           // Transform to our format
           return NextResponse.json({
             id: contact.id,
             firstName: contact.firstName,
             lastName: contact.lastName,
             name: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
             email: contact.email,
             phone: contact.phone,
             address1: contact.address1,
             city: contact.city,
             state: contact.state,
             zip: contact.postalCode || contact.zip,
             companyName: contact.companyName,
             website: contact.website,
           }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('GHL contact fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

