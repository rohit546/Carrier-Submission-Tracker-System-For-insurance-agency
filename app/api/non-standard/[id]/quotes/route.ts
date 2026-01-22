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
    const { carrier, email, amount, received_date, notes, status } = body;

    if (!carrier || !email || !received_date) {
      return NextResponse.json(
        { error: 'Missing required fields: carrier, email, received_date' },
        { status: 400 }
      );
    }

    const submission = await getNonStandardSubmission(params.id);
    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const newQuote: NonStandardQuote = {
      id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      carrier,
      email,
      amount: amount ? parseFloat(amount) : undefined,
      received_date,
      notes,
      status: status || 'received',
    };

    const updatedQuotes = [...(submission.quotes || []), newQuote];
    
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
