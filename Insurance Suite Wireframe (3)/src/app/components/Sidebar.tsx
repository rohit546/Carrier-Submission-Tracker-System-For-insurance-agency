import { Home, FileText, Settings, HelpCircle, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import logoImage from "figma:asset/bf1eab1b84d659d2659f000ac01eda1ef0a03988.png";

interface SidebarProps {
  activeView: "home" | "settings" | "help";
  onNavigate: (view: "home" | "settings" | "help") => void;
  onLogout: () => void;
  userEmail?: string;
}

export function Sidebar({ activeView, onNavigate, onLogout, userEmail }: SidebarProps) {
  const menuItems = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "settings" as const, label: "Settings", icon: Settings },
    { id: "help" as const, label: "Help", icon: HelpCircle },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img 
            src={typeof logoImage === 'string' ? logoImage : logoImage.src} 
            alt="McKinney & Co" 
            className="h-10 w-auto"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Agent Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-green-50 text-green-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-100">
        <div className="mb-3 p-3 bg-gray-50 rounded-xl">
          <p className="text-sm truncate">{userEmail || "agent@insurance.com"}</p>
          <p className="text-xs text-gray-500">Agent</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Logout
        </Button>
      </div>
    </aside>
  );
}