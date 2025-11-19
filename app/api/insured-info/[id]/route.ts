import { NextRequest, NextResponse } from 'next/server';
import { getInsuredInformation } from '@/lib/db/queries';

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

