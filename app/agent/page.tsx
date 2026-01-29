import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Sidebar from '@/components/agent/Sidebar';
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        userEmail={currentUser?.username || 'agent@example.com'} 
        userName={currentUser?.name || 'Agent'}
      />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Accounts</h1>
            <p className="text-gray-600">Manage and track all your insurance submissions.</p>
          </div>
          <div className="flex justify-end mb-6">
            <NewSubmissionButton />
          </div>
          <SubmissionList agentId={user.userId} />
        </div>
      </div>
    </div>
  );
}
