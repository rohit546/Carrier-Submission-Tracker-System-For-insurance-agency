import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createNonStandardSubmission, getNonStandardSubmissions } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submissions = await getNonStandardSubmissions(params.id);
    return NextResponse.json(submissions);
  } catch (error: any) {
    console.error('Error fetching non-standard submissions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch non-standard submissions' },
      { status: 500 }
    );
  }
}

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
    const { from_email, to_emails, cc_emails, subject, body: emailBody, carriers } = body;

    if (!from_email || !to_emails || !Array.isArray(to_emails) || to_emails.length === 0 || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: from_email, to_emails, subject, body' },
        { status: 400 }
      );
    }

    const submission = await createNonStandardSubmission({
      submission_id: params.id,
      from_email,
      to_emails,
      cc_emails: cc_emails || [],
      subject,
      body: emailBody,
      carriers: carriers || [],
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error: any) {
    console.error('Error creating non-standard submission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create non-standard submission' },
      { status: 500 }
    );
  }
}
