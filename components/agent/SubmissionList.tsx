'use client';

import { useState, useEffect } from 'react';
import { Submission, BusinessType, Carrier } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Edit, CheckCircle } from 'lucide-react';

// Helper function to format dates consistently (prevents hydration errors)
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    // Format as MM/DD/YYYY consistently (US format)
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (e) {
    return 'N/A';
  }
}

interface SubmissionListProps {
  agentId: string;
}

export default function SubmissionList({ agentId }: SubmissionListProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [subs, bts] = await Promise.all([
        fetch('/api/submissions').then(r => r.json()),
        fetch('/api/business-types').then(r => r.json()),
      ]);
      
      const mySubmissions = subs.filter((s: Submission) => s.agentId === agentId);
      setSubmissions(mySubmissions);
      setBusinessTypes(bts);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  }

  const getBusinessTypeName = (id: string) => {
    return businessTypes.find(bt => bt.id === id)?.name || id;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bound': return 'bg-black text-white';
      case 'submitted': return 'bg-gray-700 text-white';
      case 'quoted': return 'bg-gray-600 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const isNewSubmission = (submission: Submission) => {
    // Show "NEW" tag if:
    // 1. Source is 'eform' (from eform)
    // 2. Created within last 48 hours
    if (submission.source !== 'eform') return false;
    
    const createdDate = new Date(submission.createdAt);
    const hoursSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation < 48;
  };

  return (
    <div className="space-y-4">
      {submissions.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 mb-4">No submissions yet</p>
          <Link href="/agent/new" className="btn-primary inline-block">
            Create Your First Submission
          </Link>
        </div>
      ) : (
        submissions.map((submission) => (
          <div key={submission.id} className="card p-6 hover:shadow-md transition-shadow relative">
            {/* NEW Tag - Top Right */}
            {isNewSubmission(submission) && (
              <span className="absolute top-4 right-4 badge bg-blue-600 text-white text-xs font-bold z-10">
                NEW
              </span>
            )}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-black mb-1">
                  {submission.businessName}
                </h3>
                <p className="text-sm text-gray-600">{getBusinessTypeName(submission.businessTypeId || '')}</p>
              </div>
              <span className={`badge ${getStatusColor(submission.status)} ${isNewSubmission(submission) ? 'mr-12' : ''}`}>
                {submission.status.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(submission.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>{submission.carriers.filter(c => c.quoted).length} quoted</span>
              </div>
            </div>

            <button
              onClick={() => router.push(`/agent/submission/${submission.id}`)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
            >
              <Edit className="w-4 h-4" />
              View Details
            </button>
          </div>
        ))
      )}
    </div>
  );
}
