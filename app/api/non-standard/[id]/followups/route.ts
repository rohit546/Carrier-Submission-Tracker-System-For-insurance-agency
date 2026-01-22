import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getNonStandardSubmission, updateNonStandardSubmission, getUserById } from '@/lib/db/queries';
import { NonStandardFollowup } from '@/lib/types';

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
    const { carrier_email, date, notes } = body;

    if (!carrier_email || !date || !notes) {
      return NextResponse.json(
        { error: 'Missing required fields: carrier_email, date, notes' },
        { status: 400 }
      );
    }

    const submission = await getNonStandardSubmission(params.id);
    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Get current user email for created_by
    const dbUser = await getUserById(user.userId);
    const currentUserEmail = dbUser?.username ? `${dbUser.username}@mckinneyandco.com` : 'unknown@mckinneyandco.com';

    const newFollowup: NonStandardFollowup = {
      id: `followup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      carrier_email,
      date,
      type: 'note', // Default type since we removed the field
      with: '', // Empty since we removed the field
      notes,
      created_by: currentUserEmail,
    };

    const updatedFollowups = [...(submission.followups || []), newFollowup];
    
    const updated = await updateNonStandardSubmission(params.id, {
      followups: updatedFollowups,
      last_activity_at: new Date().toISOString(),
      last_activity_type: 'followup',
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error adding followup:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add followup' },
      { status: 500 }
    );
  }
}
