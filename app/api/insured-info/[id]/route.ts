import { NextRequest, NextResponse } from 'next/server';
import { getInsuredInformation, updateInsuredInformation } from '@/lib/db/queries';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const insuredInfo = await getInsuredInformation(params.id);
    
    if (!insuredInfo) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    return NextResponse.json(insuredInfo);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch insured information' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required field
    if (body.corporationName !== undefined && !body.corporationName?.trim()) {
      return NextResponse.json(
        { error: 'Corporation name is required' },
        { status: 400 }
      );
    }

    // Update insured information
    const updated = await updateInsuredInformation(params.id, body);
    
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[PATCH /api/insured-info] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update insured information' },
      { status: 500 }
    );
  }
}

