import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import NewSubmissionForm from '@/components/agent/NewSubmissionForm';
import { getUsers } from '@/lib/db';

export default async function NewSubmissionPage() {
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-black mb-8">New Submission</h2>
        <NewSubmissionForm agentId={user.userId} />
      </div>
    </div>
  );
}
