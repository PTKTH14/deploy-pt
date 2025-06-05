
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Home, Users, Calendar, FileText, MapPin } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, userProfile } = useAuth();

  const navItems = [
    { path: '/', label: 'หน้าหลัก', icon: Home },
    { path: '/patient-list', label: 'ผู้รับบริการ', icon: Users },
    { path: '/appointment-management', label: 'นัดหมาย', icon: Calendar },
    { path: '/appointments', label: 'จัดการนัดหมาย', icon: Calendar },
    { path: '/home-visits', label: 'เยี่ยมบ้าน', icon: MapPin },
    { path: '/reports', label: 'รายงาน', icon: FileText },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-600">
                ระบบนัดหมายผู้ป่วย
              </h1>
            </div>
            
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant={isActive(item.path) ? "default" : "ghost"}
                    onClick={() => navigate(item.path)}
                    className={isActive(item.path) ? "bg-blue-600 text-white" : ""}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {userProfile?.full_name}
            </span>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="text-gray-700 hover:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
