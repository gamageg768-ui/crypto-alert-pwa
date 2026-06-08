// app/page.tsx — Landing page
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="font-bold text-xl text-gray-900">CryptoAlert</span>
        </div>
        <Link
          href="/login"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          Get Started
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm px-4 py-2 rounded-full mb-6 font-medium border border-blue-100">
          <span className="w-2 h-2 bg-blue-500 rounded-full live-dot"></span>
          Powered by Groq AI + Neon Database
        </div>

        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Real-Time Price Alerts for<br />
          <span className="text-blue-600">Crypto & Stocks</span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Set smart alerts, get instant webhook notifications, and receive AI-powered market
          analysis — all in one progressive web app.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition font-semibold text-lg"
          >
            Start Free →
          </Link>
          <Link
            href="#features"
            className="text-gray-600 hover:text-gray-900 font-medium transition"
          >
            Learn more
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { stat: '50+', label: 'Crypto Assets' },
            { stat: '<1s', label: 'Alert Latency' },
            { stat: 'AI', label: 'Groq Powered' },
            { stat: '∞', label: 'Webhooks' },
          ].map(({ stat, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold text-blue-600">{stat}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything you need</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '📊',
              title: 'Real-Time Prices',
              desc: 'Live streaming prices for 100+ crypto and major stocks via CoinGecko & Alpha Vantage APIs.',
            },
            {
              icon: '🔔',
              title: 'Smart Alerts',
              desc: 'Set price above/below or % change alerts. Get notified the moment your threshold is hit.',
            },
            {
              icon: '🤖',
              title: 'Groq AI Analysis',
              desc: 'Every triggered alert includes a Groq-powered market analysis and threshold suggestions.',
            },
            {
              icon: '🔗',
              title: 'Webhook Delivery',
              desc: 'Fire signed webhooks to any URL — Discord, Slack, Zapier, your own backend.',
            },
            {
              icon: '🗄️',
              title: 'Neon PostgreSQL',
              desc: 'Serverless Neon DB for fast, scalable alert history and price snapshot storage.',
            },
            {
              icon: '📱',
              title: 'PWA — Install Anywhere',
              desc: 'Install on mobile or desktop. Works offline. Feels like a native app.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <span className="text-3xl">{icon}</span>
              <h3 className="font-semibold text-gray-900 mt-3 mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>Built with Next.js · Neon · Groq AI · Tailwind CSS</p>
      </footer>
    </main>
  );
}
