
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, MapPin, BarChart3, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const location = useLocation();

  const navigationItems = [
    { name: 'แดชบอร์ด', href: '/', icon: Home },
    { name: 'ผู้มาใช้บริการ', href: '/patients', icon: Users },
    { name: 'นัดหมาย', href: '/appointments', icon: Calendar },
    { name: 'เยี่ยมบ้าน', href: '/home-visits', icon: MapPin },
    { name: 'รายงาน', href: '/reports', icon: BarChart3 },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-white text-xl font-bold">CareSync+</h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        isActive
                          ? 'bg-blue-700 text-white'
                          : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-white text-sm mr-4">พีรพงษ์ เมืองอินทร์ (PT)</span>
            <Button variant="ghost" size="sm" className="text-white hover:bg-blue-700">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
