// components/Navbar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

const navItems = [
  { href: '/dashboard', label: '📊 Dashboard' },
  { href: '/alerts',    label: '🔔 Alerts' },
  { href: '/webhooks',  label: '🔗 Webhooks' },
];

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-gray-900">
          <span className="text-xl">⚡</span>
          <span className="hidden sm:inline">CryptoAlert</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition',
                pathname === href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-3">
          {user.image && (
            <img
              src={user.image}
              alt={user.name ?? 'User'}
              className="w-8 h-8 rounded-full border border-gray-200"
            />
          )}
          <span className="hidden md:block text-sm text-gray-700 font-medium max-w-[120px] truncate">
            {user.name ?? user.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
