'use client';

import { useState, useEffect } from 'react';
import { Submission, RpaTaskStatus } from '@/lib/types';
import { Building2, Shield, Loader2, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

interface RPAStatusDisplayProps {
  submissionId: string;
  initialRpaTasks?: Submission['rpa_tasks'];
}

interface CarrierStatus {
  name: string;
  icon: React.ReactNode;
  color: string;
  status?: RpaTaskStatus;
}

export default function RPAStatusDisplay({ submissionId, initialRpaTasks }: RPAStatusDisplayProps) {
  const [rpaTasks, setRpaTasks] = useState<Submission['rpa_tasks']>(initialRpaTasks);
  const [isPolling, setIsPolling] = useState(false);

  // Check if any tasks are still in progress
  const hasActiveTasks = () => {
    if (!rpaTasks) return false;
    return Object.values(rpaTasks).some(
      task => task?.status === 'queued' || task?.status === 'processing'
    );
  };

  // Fetch latest status
  async function fetchStatus() {
    try {
      const res = await fetch(`/api/submissions/${submissionId}`);
      if (res.ok) {
        const submission = await res.json();
        setRpaTasks(submission.rpa_tasks || {});
      }
    } catch (error) {
      console.error('Failed to fetch RPA status:', error);
    }
  }

  // Poll for updates if there are active tasks
  useEffect(() => {
    if (!hasActiveTasks()) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const interval = setInterval(() => {
      fetchStatus();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [rpaTasks, submissionId]);

  // Also fetch on mount
  useEffect(() => {
    fetchStatus();
  }, [submissionId]);

  // Update state when initialRpaTasks prop changes
  useEffect(() => {
    if (initialRpaTasks) {
      setRpaTasks(initialRpaTasks);
    }
  }, [initialRpaTasks]);

  if (!rpaTasks || Object.keys(rpaTasks).length === 0) {
    return null; // Don't show if no RPA tasks
  }

  const carriers: CarrierStatus[] = [
    {
      name: 'Encova',
      icon: <Building2 className="w-5 h-5" />,
      color: 'blue',
      status: rpaTasks.encova,
    },
    {
      name: 'Guard',
      icon: <Shield className="w-5 h-5" />,
      color: 'green',
      status: rpaTasks.guard,
    },
    {
      name: 'Columbia',
      icon: <Building2 className="w-5 h-5" />,
      color: 'purple',
      status: rpaTasks.columbia,
    },
  ].filter(carrier => carrier.status); // Only show carriers that have tasks

  if (carriers.length === 0) return null;

  function formatTime(dateString?: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return 'N/A';
    }
  }

  function formatElapsedTime(startTime?: string, endTime?: string): string {
    if (!startTime) return '';
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const seconds = Math.floor((end - start) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  function getStatusBadge(status: RpaTaskStatus) {
    switch (status.status) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
            <Clock className="w-3 h-3" />
            Queued
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing...
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-300">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-300">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return null;
    }
  }

  function getCarrierColorClasses(color: string) {
    switch (color) {
      case 'blue':
        return 'border-blue-200 bg-blue-50/30';
      case 'green':
        return 'border-green-200 bg-green-50/30';
      case 'purple':
        return 'border-purple-200 bg-purple-50/30';
      default:
        return 'border-gray-200 bg-gray-50/30';
    }
  }

  function getCarrierIconColor(color: string) {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'green':
        return 'text-green-600';
      case 'purple':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">RPA Automation Status</h3>
        {isPolling && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Checking for updates...
          </span>
        )}
      </div>

      <div className="space-y-4">
        {carriers.map((carrier) => {
          const status = carrier.status!;

          return (
            <div
              key={carrier.name}
              className={`border rounded-lg p-4 ${getCarrierColorClasses(carrier.color)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={getCarrierIconColor(carrier.color)}>
                    {carrier.icon}
                  </div>
                  <span className="font-semibold text-black">{carrier.name}</span>
                </div>
                {getStatusBadge(status)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>Started: {formatTime(status.submitted_at)}</span>
                  {status.status === 'processing' && (
                    <span className="text-gray-500">
                      • Elapsed: {formatElapsedTime(status.submitted_at)}
                    </span>
                  )}
                </div>

                {status.completed_at && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Completed: {formatTime(status.completed_at)}</span>
                  </div>
                )}

                {status.status === 'completed' && status.result && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                    {status.result.policy_code && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Policy Code:</span>{' '}
                        <span className="text-gray-900">{status.result.policy_code}</span>
                      </div>
                    )}
                    {status.result.quote_url && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Quote:</span>{' '}
                        <a
                          href={status.result.quote_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                        >
                          View Quote
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {status.result.message && (
                      <div className="text-sm text-gray-600 italic">
                        {status.result.message}
                      </div>
                    )}
                  </div>
                )}

                {status.status === 'failed' && status.error && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <div className="text-sm text-red-700">
                      <span className="font-medium">Error:</span> {status.error}
                    </div>
                    {status.error_details && (
                      <div className="text-xs text-red-600 mt-1">
                        {status.error_details}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

