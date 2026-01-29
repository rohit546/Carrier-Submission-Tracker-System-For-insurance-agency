'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Settings, HelpCircle, LogOut, ArrowRight } from 'lucide-react';

interface SidebarProps {
  userEmail: string;
  userName: string;
}

export default function Sidebar({ userEmail, userName }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/agent') {
      return pathname === '/agent' || pathname.startsWith('/agent/submission');
    }
    return pathname === path;
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Branding */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">McKinney & CO.</h1>
            <p className="text-xs text-gray-500">Small Business Insurance</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-3 font-medium">Agent Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <button
            onClick={() => router.push('/agent')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive('/agent')
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Home className="w-5 h-5" />
            Home
          </button>
          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
          >
            <HelpCircle className="w-5 h-5" />
            Help
          </button>
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Agent</p>
          <p className="text-sm font-medium text-gray-900">{userEmail}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
