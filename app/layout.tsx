// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'CryptoAlert — Real-Time Price Alerts', template: '%s | CryptoAlert' },
  description: 'Real-time crypto & stock price alerts with AI analysis, webhooks, and Neon database.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'CryptoAlert' },
  openGraph: {
    type: 'website',
    title: 'CryptoAlert PWA',
    description: 'Real-time crypto & stock price alerts powered by Groq AI',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
