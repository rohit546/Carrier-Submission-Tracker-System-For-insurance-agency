import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import EnhancedSubmissionDetail from '@/components/agent/EnhancedSubmissionDetail';
import { getSubmission, getUsers } from '@/lib/db';

export default async function SubmissionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    notFound();
  }
  
  if (user.role === 'admin') {
    notFound();
  }

  const submission = await getSubmission(params.id);
  
  if (!submission) {
    notFound();
  }

  const users = await getUsers();
  const currentUser = users.find(u => u.id === user.userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={{ name: currentUser?.name || 'Agent', role: 'agent' }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EnhancedSubmissionDetail submission={submission} />
      </div>
    </div>
  );
}
