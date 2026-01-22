'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function NewSubmissionButton() {
  return (
    <Link 
      href="/agent/new" 
      className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <Plus className="w-5 h-5" />
      New Submission
    </Link>
  );
}

