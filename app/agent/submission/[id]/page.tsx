import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getSubmission } from '@/lib/db/queries';
import Navbar from '@/components/Navbar';
import EnhancedSubmissionDetail from '@/components/agent/EnhancedSubmissionDetail';
import { getUsers } from '@/lib/db';

interface PageProps {
  params: { id: string };
  searchParams: { token?: string };
}

export default async function SubmissionDetailPage({ params, searchParams }: PageProps) {
  const { id } = params;
  const { token } = searchParams;

  // If token is provided, allow public access (no auth required)
  if (token) {
    const submission = await getSubmission(id, token);
    if (!submission) {
      redirect('/login');
    }
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              🔗 <strong>Public Access Link</strong> - You're viewing this submission via a direct link from the eform.
            </p>
          </div>
          <EnhancedSubmissionDetail submission={submission} />
        </div>
      </div>
    );
  }

  // Otherwise, require authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const submission = await getSubmission(id);
  if (!submission) {
    redirect('/agent');
  }

  // Agents can only see their own submissions (unless admin)
  if (user.role === 'agent' && submission.agentId !== user.userId) {
    redirect('/agent');
  }

  const users = await getUsers();
  const currentUser = users.find(u => u.id === user.userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={{ name: currentUser?.name || 'Agent', role: user.role }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EnhancedSubmissionDetail submission={submission} />
      </div>
    </div>
  );
}
