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
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        userEmail={currentUser?.username || 'agent@example.com'} 
        userName={currentUser?.name || 'Agent'}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <SubmissionList agentId={user.userId} />
        </div>
      </main>
    </div>
  );
}
