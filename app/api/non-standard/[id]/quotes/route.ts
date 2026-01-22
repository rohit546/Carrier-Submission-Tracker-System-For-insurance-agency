import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getNonStandardSubmission, updateNonStandardSubmission } from '@/lib/db/queries';
import { NonStandardQuote } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { carrier_email, carrier, amount, received_date, notes, status } = body;

    if (!carrier_email || !carrier || !received_date) {
      return NextResponse.json(
        { error: 'Missing required fields: carrier_email, carrier, received_date' },
        { status: 400 }
      );
    }

    const submission = await getNonStandardSubmission(params.id);
    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check if quote already exists for this carrier (only one quote per carrier)
    const existingQuotes = submission.quotes || [];
    const existingQuoteIndex = existingQuotes.findIndex(q => q.carrier_email === carrier_email);

    const quoteData: NonStandardQuote = {
      id: existingQuoteIndex >= 0 
        ? existingQuotes[existingQuoteIndex].id 
        : `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      carrier_email,
      carrier,
      amount: amount ? parseFloat(amount) : undefined,
      received_date,
      notes,
      status: status || 'received',
    };

    // Replace existing quote or add new one
    const updatedQuotes = existingQuoteIndex >= 0
      ? existingQuotes.map((q, idx) => idx === existingQuoteIndex ? quoteData : q)
      : [...existingQuotes, quoteData];
    
    const updated = await updateNonStandardSubmission(params.id, {
      quotes: updatedQuotes,
      status: submission.status === 'sent' ? 'quoted' : submission.status,
      last_activity_at: new Date().toISOString(),
      last_activity_type: 'quote',
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error adding quote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add quote' },
      { status: 500 }
    );
  }
}
