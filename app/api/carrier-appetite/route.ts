import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCarrierAppetite, setCarrierAppetite, deleteCarrierAppetite } from '@/lib/db/queries';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appetites = await getCarrierAppetite();
  return NextResponse.json(appetites);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { carrierId, businessTypeId, ...appetiteData } = data;
    
    const appetite = await setCarrierAppetite(carrierId, businessTypeId, {
      playbookData: {
        geographicRestrictions: appetiteData.geographicRestrictions,
        exclusions: appetiteData.exclusions,
        coverageDetails: appetiteData.coverageDetails,
        operationalCriteria: appetiteData.operationalCriteria,
        contactInfo: appetiteData.contactInfo,
        notes: appetiteData.notes,
      },
      geographicRestrictions: appetiteData.geographicRestrictions || [],
      exclusions: appetiteData.exclusions || [],
      status: appetiteData.status || 'active',
      coverageDetails: appetiteData.coverageDetails || {},
      operationalCriteria: appetiteData.operationalCriteria || {},
      contactInfo: appetiteData.contactInfo || {},
      notes: appetiteData.notes || '',
    });
    
    return NextResponse.json(appetite);
  } catch (error: any) {
    console.error('Error saving carrier appetite:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save carrier appetite' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { carrierId, businessTypeId } = await request.json();
    await deleteCarrierAppetite(carrierId, businessTypeId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete carrier appetite' },
      { status: 500 }
    );
  }
}