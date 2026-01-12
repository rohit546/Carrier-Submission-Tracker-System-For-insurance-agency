'use client';

import { useState, useEffect } from 'react';
import { Submission, RpaTaskStatus } from '@/lib/types';
import { X, Building2, Shield, Loader2, CheckCircle, XCircle, Clock, ExternalLink, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface AutomationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  initialRpaTasks?: Submission['rpa_tasks'];
}

interface CarrierStatusInfo {
  name: string;
  key: 'encova' | 'guard' | 'columbia' | 'novatae';
  icon: React.ReactNode;
  color: string;
  status?: RpaTaskStatus;
}

export default function AutomationStatusModal({ isOpen, onClose, submissionId, initialRpaTasks }: AutomationStatusModalProps) {
  const [rpaTasks, setRpaTasks] = useState<Submission['rpa_tasks']>(initialRpaTasks);
  const [isPolling, setIsPolling] = useState(false);
  const [, setProgressUpdate] = useState(0); // Force re-render for progress bar

  // Check if any tasks are still in progress
  const hasActiveTasks = () => {
    if (!rpaTasks) return false;
    return Object.values(rpaTasks).some(
      task => task?.status === 'queued' || task?.status === 'accepted' || task?.status === 'running'
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

  // Simulate status progression for user engagement
  useEffect(() => {
    if (!isOpen || !rpaTasks) return;

    const intervals: NodeJS.Timeout[] = [];

    (Object.entries(rpaTasks) as [keyof typeof rpaTasks, RpaTaskStatus | undefined][]).forEach(([carrier, task]) => {
      if (!task) return;

      // Only simulate if task is queued or accepted (not completed/failed)
      if (task.status === 'queued' || task.status === 'accepted') {
        const submittedTime = new Date(task.submitted_at).getTime();
        const now = Date.now();
        const elapsed = now - submittedTime;

        // Auto-progress to accepted after 2 seconds if still queued
        if (task.status === 'queued' && elapsed > 2000 && !task.accepted_at) {
          const acceptedTimeout = setTimeout(() => {
            setRpaTasks(prev => {
              if (!prev) return prev;
              const carrierKey = carrier as 'encova' | 'guard' | 'columbia';
              return {
                ...prev,
                [carrierKey]: {
                  ...task,
                  status: 'accepted' as const,
                  accepted_at: new Date().toISOString(),
                }
              };
            });
          }, Math.max(0, 2000 - elapsed));
          intervals.push(acceptedTimeout);
        }

        // Auto-progress to running after 5 seconds if accepted
        if (task.status === 'accepted' && elapsed > 5000 && !task.running_at) {
          const runningTimeout = setTimeout(() => {
            setRpaTasks(prev => {
              if (!prev) return prev;
              const carrierKey = carrier as 'encova' | 'guard' | 'columbia' | 'novatae';
              const currentTask = prev[carrierKey];
              return {
                ...prev,
                [carrierKey]: {
                  ...currentTask,
                  ...task,
                  status: 'running' as const,
                  running_at: new Date().toISOString(),
                }
              };
            });
          }, Math.max(0, 5000 - elapsed));
          intervals.push(runningTimeout);
        }
      }
    });

    return () => {
      intervals.forEach(clearTimeout);
    };
  }, [rpaTasks, isOpen]);

  // Update progress bar in real-time for running tasks
  useEffect(() => {
    if (!isOpen || !hasActiveTasks()) return;

    const interval = setInterval(() => {
      setProgressUpdate(prev => prev + 1); // Force re-render to update progress
    }, 1000); // Update every second for smooth progress

    return () => clearInterval(interval);
  }, [rpaTasks, isOpen]);

  // Poll for updates if there are active tasks
  useEffect(() => {
    if (!isOpen || !hasActiveTasks()) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const interval = setInterval(() => {
      fetchStatus();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [rpaTasks, submissionId, isOpen]);

  // Fetch on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [submissionId, isOpen]);

  // Update state when initialRpaTasks prop changes
  useEffect(() => {
    if (initialRpaTasks) {
      setRpaTasks(initialRpaTasks);
    }
  }, [initialRpaTasks]);

  if (!isOpen) return null;

  const carriers: CarrierStatusInfo[] = [
    {
      name: 'Encova',
      key: 'encova',
      icon: <Building2 className="w-5 h-5" />,
      color: 'blue',
      status: rpaTasks?.encova,
    },
    {
      name: 'Guard',
      key: 'guard',
      icon: <Shield className="w-5 h-5" />,
      color: 'green',
      status: rpaTasks?.guard,
    },
    {
      name: 'Columbia',
      key: 'columbia',
      icon: <Building2 className="w-5 h-5" />,
      color: 'purple',
      status: rpaTasks?.columbia,
    },
    {
      name: 'Novatae AMC',
      key: 'novatae',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      color: 'orange',
      status: rpaTasks?.novatae,
    },
  ];

  function formatTime(dateString?: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
      });
    } catch {
      return 'N/A';
    }
  }

  function formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: 'numeric'
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
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  function getStatusBadge(status: RpaTaskStatus) {
    switch (status.status) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300">
            <Clock className="w-4 h-4" />
            Queued
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700 border border-blue-300">
            <CheckCircle className="w-4 h-4" />
            Accepted
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-700 border border-yellow-300">
            <Loader2 className="w-4 h-4 animate-spin" />
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium bg-green-100 text-green-700 border border-green-300">
            <CheckCircle className="w-4 h-4" />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-700 border border-red-300">
            <XCircle className="w-4 h-4" />
            Failed
          </span>
        );
      default:
        return null;
    }
  }

  function getProgressPercentage(status: RpaTaskStatus): number {
    if (status.status === 'completed') return 100;
    if (status.status === 'failed') return 100;
    if (status.status === 'running') {
      // Calculate progress based on elapsed time (assume 3-5 minutes total)
      const runningTime = status.running_at ? new Date(status.running_at).getTime() : Date.now();
      const elapsed = Date.now() - runningTime;
      const estimatedTotal = 4 * 60 * 1000; // 4 minutes average
      const progress = Math.min(95, Math.max(30, (elapsed / estimatedTotal) * 100));
      return progress;
    }
    if (status.status === 'accepted') return 20;
    if (status.status === 'queued') return 5;
    return 0;
  }

  function getCarrierColorClasses(color: string) {
    switch (color) {
      case 'blue':
        return 'border-blue-200 bg-blue-50/30';
      case 'green':
        return 'border-green-200 bg-green-50/30';
      case 'purple':
        return 'border-purple-200 bg-purple-50/30';
      case 'orange':
        return 'border-orange-200 bg-orange-50/30';
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
      case 'orange':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  }

  const hasAnySubmissions = rpaTasks && Object.keys(rpaTasks).length > 0;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-black">Automation Status</h2>
          <div className="flex items-center gap-3">
            {isPolling && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Updating...
              </span>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!hasAnySubmissions ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Automation Submitted</h3>
              <p className="text-gray-500">
                This submission has not been sent to any RPA automation yet.
                <br />
                Click "Auto Submit" to start the automation process.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {carriers.map((carrier) => {
                const status = carrier.status;
                
                if (!status) {
                  return (
                    <div
                      key={carrier.key}
                      className="border rounded-lg p-4 border-gray-200 bg-gray-50/30 opacity-60"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-gray-400">
                          {carrier.icon}
                        </div>
                        <span className="font-semibold text-gray-500">{carrier.name}</span>
                        <span className="ml-auto text-sm text-gray-500">Not submitted</span>
                      </div>
                    </div>
                  );
                }

                const progress = getProgressPercentage(status);
                const isActive = status.status === 'queued' || status.status === 'accepted' || status.status === 'running';
                const showProgress = isActive || status.status === 'completed';

                return (
                  <div
                    key={carrier.key}
                    className={`border rounded-lg p-4 ${getCarrierColorClasses(carrier.color)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={getCarrierIconColor(carrier.color)}>
                          {carrier.icon}
                        </div>
                        <span className="font-semibold text-black text-lg">{carrier.name}</span>
                      </div>
                      {getStatusBadge(status)}
                    </div>

                    {/* Progress Bar */}
                    {showProgress && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium ${
                            status.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {status.status === 'completed' ? 'Completed' : 'Progress'}
                          </span>
                          <span className={`text-xs font-semibold ${
                            status.status === 'completed' ? 'text-green-700' : 'text-gray-700'
                          }`}>
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              status.status === 'queued' ? 'bg-gray-400' :
                              status.status === 'accepted' ? 'bg-blue-500' :
                              status.status === 'running' ? 'bg-yellow-500' :
                              status.status === 'completed' ? 'bg-green-500' :
                              'bg-red-500'
                            }`}
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                          {status.status === 'running' && (
                            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      {/* Status Timeline */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span><strong>Submitted:</strong> {formatDate(status.submitted_at)} at {formatTime(status.submitted_at)}</span>
                        </div>
                        
                        {status.accepted_at && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <CheckCircle className="w-3 h-3" />
                            <span><strong>Accepted:</strong> {formatDate(status.accepted_at)} at {formatTime(status.accepted_at)}</span>
                            <span className="text-gray-500">
                              ({formatElapsedTime(status.submitted_at, status.accepted_at)} later)
                            </span>
                          </div>
                        )}
                        
                        {status.running_at && (
                          <div className="flex items-center gap-2 text-yellow-600">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span><strong>Running:</strong> {formatDate(status.running_at)} at {formatTime(status.running_at)}</span>
                            {status.status === 'running' && (
                              <span className="text-gray-500">
                                (Elapsed: {formatElapsedTime(status.running_at)})
                              </span>
                            )}
                          </div>
                        )}
                        
                        {status.completed_at && (
                          <div className={`flex items-center gap-2 ${status.status === 'completed' ? 'text-green-600' : 'text-red-600'}`}>
                            <CheckCircle className="w-3 h-3" />
                            <span><strong>{status.status === 'completed' ? 'Completed' : 'Failed'}:</strong> {formatDate(status.completed_at)} at {formatTime(status.completed_at)}</span>
                            {status.running_at && (
                              <span className="text-gray-500">
                                ({formatElapsedTime(status.running_at, status.completed_at)} processing time)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Results */}
                      {status.status === 'completed' && status.result && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                          {status.result.policy_code && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Policy Code:</span>{' '}
                              <span className="text-gray-900 font-mono">{status.result.policy_code}</span>
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
                          {(status.result.sheet_url || status.result.sheetUrl) && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Sheet:</span>{' '}
                              <a
                                href={status.result.sheet_url || status.result.sheetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                              >
                                View Sheet
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          {status.result.message && (
                            <div className="text-sm text-gray-600 italic bg-green-50 p-2 rounded">
                              {status.result.message}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Error */}
                      {status.status === 'failed' && status.error && (
                        <div className="mt-4 pt-4 border-t border-red-200">
                          <div className="text-sm text-red-700">
                            <span className="font-medium">Error:</span> {status.error}
                          </div>
                          {status.error_details && (
                            <div className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">
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
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

