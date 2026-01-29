'use client';

import { useState, useEffect } from 'react';
import { Submission, BusinessType, Carrier } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, FileText, Loader2, Search, X, ArrowRight, TrendingUp, Building2 } from 'lucide-react';
import NewSubmissionButton from './NewSubmissionButton';

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
      case 'bound': 
      case 'submitted': 
      case 'quoted': return 'bg-green-100 text-green-700 border-green-200'; // ACTIVE
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200'; // COMPLETED
      default: return 'bg-gray-100 text-gray-700 border-gray-200'; // DRAFT
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'bound': 
      case 'submitted': 
      case 'quoted': return 'ACTIVE';
      case 'completed': return 'COMPLETED';
      default: return 'DRAFT';
    }
  };

  // Calculate progress percentage based on status and quoted carriers
  const calculateProgress = (submission: Submission) => {
    if (submission.status === 'bound' || submission.status === 'completed') return 100;
    const quotedCount = submission.carriers.filter(c => c.quoted).length;
    const totalCarriers = submission.carriers.length || 1;
    const baseProgress = submission.status === 'draft' ? 20 : submission.status === 'quoted' ? 60 : 40;
    const carrierProgress = (quotedCount / totalCarriers) * 30;
    return Math.min(100, Math.round(baseProgress + carrierProgress));
  };

  // Calculate summary statistics
  const summaryStats = {
    total: submissions.length,
    active: submissions.filter(s => ['bound', 'submitted', 'quoted'].includes(s.status)).length,
    completed: submissions.filter(s => s.status === 'bound' || s.status === 'completed').length,
    draft: submissions.filter(s => s.status === 'draft').length,
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

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold text-gray-900">My Accounts</h2>
          <NewSubmissionButton />
        </div>
        <p className="text-gray-600">
          Manage and track all your insurance submissions
        </p>
      </div>

      {/* Stats Cards */}
      {submissions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-sm border-0 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Accounts</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm border-0 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.active}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-sm border-0 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl shadow-sm border-0 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Draft</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.draft}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubmissions.map((submission) => (
            <div 
              key={submission.id} 
              onClick={() => {
                setNavigatingTo(submission.id);
                router.push(`/agent/submission/${submission.id}`);
              }}
              className="bg-white rounded-xl shadow-sm border-0 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-green-600 transition-colors">
                    {submission.businessName}
                  </h3>
                  {getBusinessTypeName(submission.businessTypeId || '') && (
                    <p className="text-sm text-gray-500 truncate">
                      {getBusinessTypeName(submission.businessTypeId || '')}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(submission.status)}`}>
                  {getStatusLabel(submission.status)}
                </span>
              </div>

              {/* Progress */}
              {calculateProgress(submission) !== undefined && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-green-600 font-semibold">
                      {calculateProgress(submission)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgress(submission)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Meta Information */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {formatDate(submission.createdAt)}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <FileText className="w-4 h-4" />
                  {submission.carriers.filter(c => c.quoted).length || 0} {submission.carriers.filter(c => c.quoted).length === 1 ? 'quote' : 'quotes'}
                </div>
              </div>

              {/* Hover Action */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNavigatingTo(submission.id);
                  router.push(`/agent/submission/${submission.id}`);
                }}
                disabled={navigatingTo !== null}
                className="w-full mt-4 text-green-600 hover:bg-green-50 opacity-0 group-hover:opacity-100 transition-opacity py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                View Details →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
