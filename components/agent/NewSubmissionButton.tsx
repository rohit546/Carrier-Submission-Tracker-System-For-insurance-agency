'use client';

import Link from 'next/link';

export default function NewSubmissionButton() {
  return (
    <Link href="/agent/new" className="btn-primary">
      New Submission
    </Link>
  );
}

