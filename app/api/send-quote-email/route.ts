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
  ccEmail?: string;
  subject: string;
  body: string;
  pdfs?: PdfAttachment[];
}

export async function POST(request: NextRequest) {
  try {
    const body: SendEmailRequest = await request.json();
    const { fromEmail, toEmails, ccEmail, subject, body: emailBody, pdfs } = body;

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

        // Add CC if provided
        if (ccEmail && ccEmail.trim()) {
          payload.cc_email = ccEmail;
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
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
          console.log(`   ✅ Sent to ${toEmail} (ID: ${data.message_id})`);
          results.push({ email: toEmail, success: true, messageId: data.message_id });
        } else {
          console.log(`   ❌ Failed to send to ${toEmail}: ${data.error || 'Unknown error'}`);
          results.push({ email: toEmail, success: false, error: data.error || 'Failed to send' });
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

