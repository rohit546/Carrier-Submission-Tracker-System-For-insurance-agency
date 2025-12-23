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
    
    if (!carrier || !task_id || !submission_id || !status || !completed_at) {
      console.error('[WEBHOOK] Validation failed - missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: carrier, task_id, submission_id, status, completed_at' },
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

    // Validate status
    if (!['completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: completed or failed' },
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
    
    // Update the specific carrier's status
    const updatedRpaTasks = {
      ...currentRpaTasks,
      [carrier]: {
        task_id,
        status,
        completed_at,
        submitted_at: currentRpaTasks[carrier]?.submitted_at || completed_at,
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

