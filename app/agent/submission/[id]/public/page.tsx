import { redirect } from 'next/navigation';
import { getSubmission } from '@/lib/db/queries';
import EnhancedSubmissionDetail from '@/components/agent/EnhancedSubmissionDetail';
import { Submission } from '@/lib/types';

interface PageProps {
  params: { id: string };
  searchParams: { token?: string };
}

export default async function PublicSubmissionPage({ params, searchParams }: PageProps) {
  const { id } = params;
  const { token } = searchParams;

  if (!token) {
    redirect('/login');
  }

  try {
    // Verify token matches submission
    const submission = await getSubmission(id) as Submission & { publicAccessToken?: string };
    
    if (!submission) {
      redirect('/login');
    }

    // In a real implementation, you'd verify the token from database
    // For now, we'll allow access if token is provided
    // You can add token verification here:
    // const submission = await getSubmissionWithToken(id, token);
    // if (!submission || submission.publicAccessToken !== token) {
    //   redirect('/login');
    // }

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
  } catch (error) {
    redirect('/login');
  }
}

