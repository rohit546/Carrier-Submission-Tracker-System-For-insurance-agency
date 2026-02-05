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
        <div className="p-5">
          <InsuranceForm />
        </div>
      </main>
    </div>
  );
}
