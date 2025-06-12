import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import LogoutButton from './LogoutButton';
import TaskManager from './TaskManager';

export default async function Dashboard() {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hello, {session.user.name}!
              </h1>
              <p className="text-gray-600">
                Welcome to your dashboard. Manage your tasks below.
              </p>
            </div>
            <div className="w-32">
              <LogoutButton />
            </div>
          </div>
        </div>
        
        <TaskManager userName={session.user.name} />
      </div>
    </div>
  );
}