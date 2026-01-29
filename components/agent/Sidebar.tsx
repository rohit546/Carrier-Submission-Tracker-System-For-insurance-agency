'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Settings, HelpCircle, LogOut } from 'lucide-react';

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
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Agent Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <button
            onClick={() => router.push('/agent')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive('/agent')
                ? 'bg-green-50 text-green-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            <HelpCircle className="w-5 h-5" />
            <span>Help</span>
          </button>
        </div>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-100">
        <div className="mb-3 p-3 bg-gray-50 rounded-xl">
          <p className="text-sm truncate">{userEmail}</p>
          <p className="text-xs text-gray-500">Agent</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
