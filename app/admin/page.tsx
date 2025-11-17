import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import EnhancedCarrierAppetiteManager from '@/components/admin/EnhancedCarrierAppetiteManager';
import { getUsers } from '@/lib/db';

export default async function AdminPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  if (user.role !== 'admin') {
    redirect('/agent');
  }

  const users = await getUsers();
  const currentUser = users.find(u => u.id === user.userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={{ name: currentUser?.name || 'Admin', role: 'admin' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-black mb-8">Admin Dashboard</h2>
        <EnhancedCarrierAppetiteManager />
      </div>
    </div>
  );
}
