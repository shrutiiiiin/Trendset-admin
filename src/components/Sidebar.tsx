import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, DollarSign, LogOut } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
  const { logout } = useAuthStore();

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Employees',
      path: '/employees',
      icon: Users,
    },
    {
      title: 'Leaves',
      path: '/leaves',
      icon: Clock,
    },
    {
      title: 'Payroll',
      path: '/payroll',
      icon: DollarSign,
    },
  ];

  return (
    <div className="w-64 bg-[#154699] shadow-sm h-screen flex flex-col">
      <div className="p-4">
        <img
          src="/logo.png"
          alt="Company Logo"
          width={150}
          height={40}
          className="mb-8"
        />
      </div>

      <nav className="px-4 space-y-2 flex-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => onPageChange(item.title)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
              activePage === item.title
                ? 'bg-white text-[#154699] font-semibold'
                : 'text-white hover:bg-blue-600'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.title}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-blue-600">
        <button
          onClick={logout}
          className="flex w-full items-center space-x-3 px-4 py-3 text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;