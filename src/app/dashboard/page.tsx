import { auth } from '@/lib/auth/config';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/signin');
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <nav className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            App Template
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {session.user.email}
            </span>
            <form action="/api/auth/sign-out" method="POST">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Dashboard
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Welcome to your protected dashboard!
          </p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Your Profile
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Name:
              </span>
              <p className="text-base text-zinc-900 dark:text-zinc-50">
                {session.user.name || 'Not set'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Email:
              </span>
              <p className="text-base text-zinc-900 dark:text-zinc-50">
                {session.user.email}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Email Verified:
              </span>
              <p className="text-base text-zinc-900 dark:text-zinc-50">
                {session.user.emailVerified ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                User ID:
              </span>
              <p className="text-base text-zinc-900 dark:text-zinc-50 font-mono text-sm">
                {session.user.id}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="text-2xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Analytics
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              View your usage statistics and insights
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="text-2xl mb-3">⚙️</div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Settings
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Manage your account and preferences
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="text-2xl mb-3">📚</div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Documentation
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Learn how to use this template
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>ℹ️ This is a protected route.</strong> Only authenticated users can access this page.
            You can use this pattern to create other protected routes in your application.
          </p>
        </div>
      </main>
    </div>
  );
}
