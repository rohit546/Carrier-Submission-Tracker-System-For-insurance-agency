import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Sidebar from '@/components/agent/Sidebar';
import InsuranceForm from '@/components/agent/form/InsuranceForm';
import { getUsers } from '@/lib/db';

export default async function FormPage() {
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Convenience Store Insurance Application</h1>
            <p className="text-gray-600">Complete the form below to submit your application.</p>
          </div>
          <InsuranceForm />
        </div>
      </main>
    </div>
  );
}
