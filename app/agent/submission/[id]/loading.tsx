import { Loader2, FileText } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
            <p className="text-sm text-gray-500">Please wait while we fetch the details...</p>
          </div>
          <div className="w-72 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
