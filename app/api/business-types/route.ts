import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getBusinessTypes, createBusinessType } from '@/lib/db/queries';

export async function GET() {
  const types = await getBusinessTypes();
  return NextResponse.json(types);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    const type = await createBusinessType({ name });
    return NextResponse.json(type);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create business type' },
      { status: 500 }
    );
  }
}