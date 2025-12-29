import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import SubmissionList from '@/components/agent/SubmissionList';
import NewSubmissionButton from '@/components/agent/NewSubmissionButton';
import { getUsers } from '@/lib/db';

export default async function AgentPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  if (user.role === 'admin') {
    redirect('/admin');
  }

  const users = await getUsers();
  const currentUser = users.find(u => u.id === user.userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={{ name: currentUser?.name || 'Agent', role: 'agent' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Dashboard Button */}
        <a
          href="https://deployment-delta-eight.vercel.app/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors text-sm mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </a>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-black">My Submissions</h2>
          <NewSubmissionButton />
        </div>
        <SubmissionList agentId={user.userId} />
      </div>
    </div>
  );
}
