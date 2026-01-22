'use client';

import { useState, useEffect } from 'react';
import { Submission, BusinessType, Carrier } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Edit, CheckCircle, Loader2, FileText } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
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
    } finally {
      setLoading(false);
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

  // Loading state with nice UI
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center space-y-5">
          <div className="relative">
            <Loader2 className="w-14 h-14 text-emerald-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="w-7 h-7 text-emerald-500" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Loading Submissions</h3>
            <p className="text-sm text-gray-500">Please wait while we fetch your data...</p>
          </div>
          <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {submissions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-6 text-base">No submissions yet</p>
            <Link 
              href="/agent/new" 
              className="inline-flex items-center justify-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Create Your First Submission
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {submissions.map((submission) => (
            <div 
              key={submission.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200 relative overflow-hidden flex flex-col h-full"
            >
              {/* NEW Tag - Top Right */}
              {isNewSubmission(submission) && (
                <span className="absolute top-4 right-4 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full z-10 shadow-sm">
                  NEW
                </span>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-4 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {submission.businessName}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium line-clamp-1">{getBusinessTypeName(submission.businessTypeId || '')}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(submission.status)} ${isNewSubmission(submission) ? 'mr-14' : ''} shadow-sm flex-shrink-0`}>
                  {submission.status.toUpperCase()}
                </span>
              </div>
              
              <div className="flex flex-col gap-3 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100 flex-grow">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="font-medium text-xs">{formatDate(submission.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="font-medium text-xs">{submission.carriers.filter(c => c.quoted).length} quoted</span>
                </div>
              </div>

              <button
                onClick={() => router.push(`/agent/submission/${submission.id}`)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-black transition-all duration-200 border border-gray-200 hover:border-gray-300 w-full mt-auto"
              >
                <Edit className="w-4 h-4" />
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
