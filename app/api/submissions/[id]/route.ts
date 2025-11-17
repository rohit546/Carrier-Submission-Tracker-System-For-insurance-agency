import { NextRequest, NextResponse } from 'next/server';
import { getSubmission, updateSubmission } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const submission = await getSubmission(params.id);
  
  if (!submission) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Agents can only see their own submissions
  if (user.role === 'agent' && submission.agentId !== user.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(submission);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const submission = await getSubmission(params.id);
  if (!submission) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Agents can only update their own submissions
  if (user.role === 'agent' && submission.agentId !== user.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const updates = await request.json();
    const updated = await updateSubmission(params.id, updates);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update submission' },
      { status: 500 }
    );
  }
}