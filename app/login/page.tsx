import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';

export default async function Login() {
  const user = await getCurrentUser();
  
  if (user) {
    if (user.role === 'admin') {
      redirect('/admin');
    } else {
      redirect('/agent');
    }
  }
  
  return <LoginForm />;
}
