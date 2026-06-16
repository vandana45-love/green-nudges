import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-green-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-6">
        <div className="text-6xl">🌿</div>
        <h1 className="text-5xl font-bold text-brand-900">Green Nudges</h1>
        <p className="text-xl text-gray-600">
          Your AI-powered personal carbon companion. Track your environmental impact automatically
          and reduce it through personalised recommendations.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/sign-up"
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-3 rounded-xl transition"
          >
            Get Started Free
          </Link>
          <Link
            href="/sign-in"
            className="border border-brand-600 text-brand-700 hover:bg-brand-50 font-semibold px-8 py-3 rounded-xl transition"
          >
            Sign In
          </Link>
        </div>
        <p className="text-sm text-gray-500">Discover your footprint in 3 minutes.</p>
      </div>
    </main>
  );
}
