import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET(request: NextRequest) {
  let client: Client | null = null

  try {
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')
    const insuredInfoId = searchParams.get('insuredInfoId')

    const connectionString = process.env.COVERSHEET_STRING
    if (!connectionString) {
      return NextResponse.json(
        { success: false, error: 'Coversheet database not configured' },
        { status: 500 }
      )
    }

    client = new Client({ connectionString })
    await client.connect()

    let results: any = {}

    // Get all records count
    const insuredCount = await client.query('SELECT COUNT(*) as count FROM insured_information')
    const submissionsCount = await client.query('SELECT COUNT(*) as count FROM submissions')
    
    results.counts = {
      insured_information: parseInt(insuredCount.rows[0].count),
      submissions: parseInt(submissionsCount.rows[0].count)
    }

    // Get recent records
    const recentInsured = await client.query(`
      SELECT id, corporation_name, contact_name, created_at, eform_submission_id
      FROM insured_information
      ORDER BY created_at DESC
      LIMIT 10
    `)
    results.recentInsured = recentInsured.rows

    const recentSubmissions = await client.query(`
      SELECT id, business_name, status, insured_info_id, public_access_token, created_at, eform_submission_id
      FROM submissions
      ORDER BY created_at DESC
      LIMIT 10
    `)
    results.recentSubmissions = recentSubmissions.rows

    // If specific IDs provided, check for them
    if (submissionId) {
      const found = await client.query('SELECT * FROM submissions WHERE id = $1', [submissionId])
      results.specificSubmission = found.rows[0] || null
    }

    if (insuredInfoId) {
      const found = await client.query('SELECT * FROM insured_information WHERE id = $1', [insuredInfoId])
      results.specificInsured = found.rows[0] || null
    }

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error: any) {
    console.error('❌ Error verifying data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to verify data' 
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.end()
    }
  }
}

