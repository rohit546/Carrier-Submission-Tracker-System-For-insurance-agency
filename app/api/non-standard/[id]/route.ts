import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getNonStandardSubmission, updateNonStandardSubmission } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submission = await getNonStandardSubmission(params.id);
    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error: any) {
    console.error('Error fetching non-standard submission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch non-standard submission' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, quotes, followups, notes, last_activity_at, last_activity_type } = body;

    const submission = await updateNonStandardSubmission(params.id, {
      status,
      quotes,
      followups,
      notes,
      last_activity_at,
      last_activity_type,
    });

    return NextResponse.json(submission);
  } catch (error: any) {
    console.error('Error updating non-standard submission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update non-standard submission' },
      { status: 500 }
    );
  }
}
