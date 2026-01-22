import { NextRequest, NextResponse } from 'next/server';

const EMAIL_SERVER_URL = 'https://webhook.mightyinvestmentgroup.com/send-email';
const AUTH_TOKEN = 'pit-123';

interface PdfAttachment {
  filename: string;
  data: string; // Base64 encoded
}

interface SendEmailRequest {
  fromEmail: string;
  toEmails: string[];
  ccEmails?: string[];
  bccEmails?: string[];
  subject: string;
  body: string;
  pdfs?: PdfAttachment[];
}

export async function POST(request: NextRequest) {
  try {
    const body: SendEmailRequest = await request.json();
    const { fromEmail, toEmails, ccEmails, bccEmails, subject, body: emailBody, pdfs } = body;

    // Validation
    if (!fromEmail || !toEmails || toEmails.length === 0 || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: fromEmail, toEmails, subject, body' },
        { status: 400 }
      );
    }

    // Validate sender is from mckinneyandco.com
    if (!fromEmail.endsWith('@mckinneyandco.com')) {
      return NextResponse.json(
        { error: 'Sender email must be from @mckinneyandco.com domain' },
        { status: 400 }
      );
    }

    console.log(`📧 Sending quote request email from ${fromEmail} to ${toEmails.length} recipient(s)`);

    const results: { email: string; success: boolean; messageId?: string; error?: string }[] = [];

    // Send email to each recipient
    for (const toEmail of toEmails) {
      try {
        const payload: any = {
          from_email: fromEmail,
          to_email: toEmail,
          subject: subject,
          body: emailBody,
        };

        // Add CC if provided (array format)
        if (ccEmails && ccEmails.length > 0) {
          payload.cc = ccEmails;
        }

        // Add BCC if provided (array format)
        if (bccEmails && bccEmails.length > 0) {
          payload.bcc = bccEmails;
        }

        // Add PDFs if provided
        if (pdfs && pdfs.length > 0) {
          payload.pdfs = pdfs.map(pdf => ({
            filename: pdf.filename,
            data: pdf.data,
          }));
        }

        const response = await fetch(EMAIL_SERVER_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify(payload),
        });

        // Check content type before parsing
        const contentType = response.headers.get('content-type') || '';
        let data: any = {};

        if (contentType.includes('application/json')) {
          try {
            data = await response.json();
          } catch (jsonError) {
            // If JSON parsing fails, read as text to see what we got
            const text = await response.text();
            console.error(`   ❌ Invalid JSON response from email server: ${text.substring(0, 200)}`);
            throw new Error(`Email server returned invalid JSON: ${text.substring(0, 100)}`);
          }
        } else {
          // Server returned HTML or other non-JSON response
          const text = await response.text();
          console.error(`   ❌ Email server returned non-JSON response (${contentType}): ${text.substring(0, 200)}`);
          throw new Error(`Email server error: ${response.status} ${response.statusText}`);
        }

        if (response.ok) {
          console.log(`   ✅ Sent to ${toEmail} (ID: ${data.message_id || 'N/A'})`);
          results.push({ email: toEmail, success: true, messageId: data.message_id });
        } else {
          console.log(`   ❌ Failed to send to ${toEmail}: ${data.error || 'Unknown error'}`);
          results.push({ email: toEmail, success: false, error: data.error || `Server error: ${response.status}` });
        }
      } catch (err: any) {
        console.log(`   ❌ Error sending to ${toEmail}: ${err.message}`);
        results.push({ email: toEmail, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`📊 Email results: ${successCount} sent, ${failedCount} failed`);

    return NextResponse.json({
      success: failedCount === 0,
      message: `Sent ${successCount}/${toEmails.length} emails successfully`,
      results,
    });

  } catch (error: any) {
    console.error('Error in send-quote-email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send emails' },
      { status: 500 }
    );
  }
}

