'use client';

import { useState, useEffect } from 'react';
import { Submission, BusinessType, Carrier } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Edit, CheckCircle, Loader2, FileText, Search, X } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
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

  // Filter submissions based on search query
  const filteredSubmissions = submissions.filter((submission) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const businessName = submission.businessName?.toLowerCase() || '';
    const businessType = getBusinessTypeName(submission.businessTypeId || '').toLowerCase();
    const status = submission.status?.toLowerCase() || '';
    const date = formatDate(submission.createdAt).toLowerCase();
    
    return (
      businessName.includes(query) ||
      businessType.includes(query) ||
      status.includes(query) ||
      date.includes(query)
    );
  });

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
    <div className="relative">
      {/* Loading Overlay */}
      {navigatingTo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-12 max-w-md mx-4">
            <div className="flex flex-col items-center justify-center space-y-5">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Loading Submission</h3>
                <p className="text-sm text-gray-500">Please wait while we load the details...</p>
              </div>
              <div className="w-72 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {submissions.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by business name, type, status, or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-500">
              {filteredSubmissions.length} {filteredSubmissions.length === 1 ? 'result' : 'results'} found
            </p>
          )}
        </div>
      )}

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
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2 text-base font-medium">No results found</p>
            <p className="text-gray-400 text-sm mb-6">Try adjusting your search terms</p>
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 border border-gray-200"
            >
              Clear Search
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubmissions.map((submission) => (
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
                onClick={() => {
                  setNavigatingTo(submission.id);
                  router.push(`/agent/submission/${submission.id}`);
                }}
                disabled={navigatingTo !== null}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-black transition-all duration-200 border border-gray-200 hover:border-gray-300 w-full mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
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
