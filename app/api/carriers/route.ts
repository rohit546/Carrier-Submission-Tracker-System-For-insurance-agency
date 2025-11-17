import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCarriers, createCarrier } from '@/lib/db/queries';

export async function GET() {
  const carriers = await getCarriers();
  return NextResponse.json(carriers);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    const carrier = await createCarrier({ name });
    return NextResponse.json(carrier);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create carrier' },
      { status: 500 }
    );
  }
}