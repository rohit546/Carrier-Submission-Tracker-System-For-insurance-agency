import { NextRequest, NextResponse } from 'next/server'

// This endpoint returns empty for now - we'll use client-side autocomplete
// because the API key doesn't have Places API Web Service enabled
export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()

    // Return instructions to enable Places API
    return NextResponse.json({
      error: 'Places API not enabled. Please enable it at: https://console.cloud.google.com/apis/library/places-backend.googleapis.com',
      note: 'Using client-side autocomplete instead (via JavaScript library which is already working)',
      suggestions: []
    })

  } catch (error: any) {
    console.error('Autocomplete API error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
