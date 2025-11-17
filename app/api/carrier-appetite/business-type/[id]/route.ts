import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCarrierAppetiteForBusinessType } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Allow both agents and admins to view carrier appetite
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const appetites = await getCarrierAppetiteForBusinessType(params.id);
    return NextResponse.json(appetites);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get carrier appetite' },
      { status: 500 }
    );
  }
}
