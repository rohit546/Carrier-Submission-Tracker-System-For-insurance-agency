import { NextRequest, NextResponse } from 'next/server';
import { getSubmission } from '@/lib/db/queries';
import sql from '@/lib/db/connection';

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'RPA webhook endpoint is ready',
    endpoint: '/api/webhooks/rpa-complete',
    method: 'POST',
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('[WEBHOOK] Received RPA completion webhook');
    console.log('[WEBHOOK] Request URL:', request.url);
    console.log('[WEBHOOK] Request method:', request.method);
    
    const body = await request.json();
    console.log('[WEBHOOK] Payload:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    const { carrier, task_id, submission_id, status, completed_at } = body;
    
    // completed_at is only required for final statuses (completed/failed)
    const requiresCompletedAt = status === 'completed' || status === 'failed';
    
    if (!carrier || !task_id || !submission_id || !status || (requiresCompletedAt && !completed_at)) {
      console.error('[WEBHOOK] Validation failed - missing required fields');
      return NextResponse.json(
        { error: `Missing required fields: carrier, task_id, submission_id, status${requiresCompletedAt ? ', completed_at' : ''}` },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // Validate carrier
    if (!['encova', 'guard', 'columbia'].includes(carrier)) {
      return NextResponse.json(
        { error: 'Invalid carrier. Must be: encova, guard, or columbia' },
        { status: 400 }
      );
    }

    // Validate status - allow all status transitions
    if (!['queued', 'accepted', 'running', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: queued, accepted, running, completed, or failed' },
        { status: 400 }
      );
    }

    // Verify submission exists
    const submission = await getSubmission(submission_id);
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Get current rpa_tasks or initialize empty object
    const currentRpaTasks = (submission as any).rpa_tasks || {};
    const currentTask = currentRpaTasks[carrier] || {};
    const now = completed_at || new Date().toISOString();
    
    // Smart status transition: if jumping from queued directly to completed/running,
    // automatically set accepted_at and running_at timestamps
    let accepted_at = currentTask.accepted_at;
    let running_at = currentTask.running_at;
    let finalStatus = status;
    
    if (status === 'accepted') {
      accepted_at = now;
    } else if (status === 'running') {
      // If we're going to running but haven't set accepted yet, set it now
      if (!accepted_at) {
        accepted_at = now;
      }
      running_at = now;
    } else if (status === 'completed' || status === 'failed') {
      // If completing but we haven't set accepted/running yet, set them with small delays
      if (!accepted_at) {
        // Set accepted 1 second after submitted
        const submittedTime = new Date(currentTask.submitted_at || now).getTime();
        accepted_at = new Date(submittedTime + 1000).toISOString();
      }
      if (!running_at) {
        // Set running 2 seconds after accepted
        const acceptedTime = new Date(accepted_at).getTime();
        running_at = new Date(acceptedTime + 2000).toISOString();
      }
    }
    
    // Update the specific carrier's status with proper timestamps
    const updatedRpaTasks = {
      ...currentRpaTasks,
      [carrier]: {
        task_id,
        status: finalStatus,
        submitted_at: currentTask.submitted_at || now,
        accepted_at: accepted_at || null,
        running_at: running_at || null,
        completed_at: (status === 'completed' || status === 'failed') ? now : (currentTask.completed_at || null),
        ...(status === 'completed' && body.result ? {
          result: {
            policy_code: body.result.policy_code || null,
            quote_url: body.result.quote_url || null,
            message: body.result.message || 'Automation completed successfully',
          }
        } : {}),
        ...(status === 'failed' ? {
          error: body.error || 'Automation failed',
          error_details: body.error_details || null,
        } : {}),
      }
    };

    // Update submission with new RPA task status
    await sql`
      UPDATE submissions
      SET rpa_tasks = ${JSON.stringify(updatedRpaTasks)}::jsonb,
          updated_at = NOW()
      WHERE id = ${submission_id}
    `;

    console.log(`[WEBHOOK] Updated ${carrier} status for submission ${submission_id}: ${status}`);

    return NextResponse.json({
      success: true,
      message: `RPA task status updated for ${carrier}`,
      carrier,
      status,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error: any) {
    console.error('[WEBHOOK] Error processing RPA completion:', error);
    console.error('[WEBHOOK] Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

