import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-black dark:to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            App Template
          </div>
          <div className="flex gap-4">
            <Link
              href="/signin"
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-zinc-50 text-white dark:text-black rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6">
          Production-Ready
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Full-Stack Template
          </span>
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-8">
          Start building your next application with Next.js 16, PostgreSQL, and Better Auth.
          Clean architecture with DDD principles built in.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 text-base font-medium bg-zinc-900 dark:bg-zinc-50 text-white dark:text-black rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Try Demo
          </Link>
          <a
            href="https://github.com/nihilok/app-template"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 text-base font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="text-3xl font-bold text-center text-zinc-900 dark:text-zinc-50 mb-12">
          Everything You Need to Build Fast
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-2xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Next.js 16
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Latest version with App Router, Server Components, and Server Actions for optimal performance.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-2xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Better Auth
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Modern authentication with email/password, session management, and ready for OAuth providers.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-2xl mb-4">🗄️</div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              PostgreSQL + Drizzle
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Type-safe database queries with Drizzle ORM and production-grade PostgreSQL.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-2xl mb-4">🏗️</div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              DDD Architecture
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Clean separation with Domain, Use Case, Repository, and API layers for maintainable code.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-2xl mb-4">🧪</div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Vitest Testing
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Fast unit, component, and integration tests with Vitest and Testing Library.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-2xl mb-4">🐳</div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Docker Ready
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Development and production Docker configs with docker-compose for easy deployment.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 bg-zinc-50 dark:bg-zinc-900/50 -mx-0 my-0">
        <h2 className="text-3xl font-bold text-center text-zinc-900 dark:text-zinc-50 mb-12">
          What You Can Build
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
              SaaS Applications
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Multi-tenant platforms with user authentication, role-based access control, and subscription management.
            </p>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
              Internal Tools
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Admin dashboards, data management systems, and business process automation tools.
            </p>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
              API Backends
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              RESTful APIs with built-in authentication, database access, and clean architecture patterns.
            </p>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
              E-commerce Platforms
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Shopping carts, product catalogs, user accounts, and order management systems.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
          Ready to Start Building?
        </h2>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-8">
          Clone the repository and have a production-ready app running in minutes.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-3 text-base font-medium bg-zinc-900 dark:bg-zinc-50 text-white dark:text-black rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
        >
          Get Started Now
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            Built with Next.js, PostgreSQL, and Better Auth.{" "}
            <a
              href="https://github.com/nihilok/app-template"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-900 dark:text-zinc-50 hover:underline"
            >
              View Documentation
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
