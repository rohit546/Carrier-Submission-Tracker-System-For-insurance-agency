import { NextRequest, NextResponse } from 'next/server';
import { getSubmissions, createSubmission } from '@/lib/db';
import { getCurrentUser as getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submissions = await getSubmissions();
    
    // Filter by agent if not admin
    if (user.role === 'agent') {
      const filtered = submissions.filter(s => s.agentId === user.userId);
      return NextResponse.json(filtered);
    }
    
    return NextResponse.json(submissions);
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const submission = await createSubmission({
      ...data,
      agentId: user.userId,
    });
    
    return NextResponse.json(submission);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create submission' },
      { status: 500 }
    );
  }
}