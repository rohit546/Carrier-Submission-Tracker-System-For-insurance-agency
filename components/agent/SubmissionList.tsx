'use client';

import { useState, useEffect } from 'react';
import { Submission, BusinessType, Carrier } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Calendar, Edit, CheckCircle } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      {submissions.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 mb-4">No submissions yet</p>
          <a href="/agent/new" className="btn-primary inline-block">
            Create Your First Submission
          </a>
        </div>
      ) : (
        submissions.map((submission) => (
          <div key={submission.id} className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-black mb-1">
                  {submission.businessName}
                </h3>
                <p className="text-sm text-gray-600">{getBusinessTypeName(submission.businessTypeId)}</p>
              </div>
              <span className={`badge ${getStatusColor(submission.status)}`}>
                {submission.status.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
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
