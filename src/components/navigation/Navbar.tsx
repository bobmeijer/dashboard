'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiGlobe, FiGrid, FiDatabase, FiAward } from 'react-icons/fi';
import { useState, useEffect } from 'react';

export const Navbar = () => {
  const pathname = usePathname();
  
  // Use a state flag to ensure we only render on client
  const [isMounted, setIsMounted] = useState(false);
  
  const navbarBgColor = 'rgb(0, 21, 71)';

  // Set the mounted flag after the component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems = [
    { href: '/', label: 'Executive', icon: <FiBarChart2 /> },
    { href: '/trends', label: 'Trends', icon: <FiTrendingUp /> },
    { href: '/languages', label: 'Languages', icon: <FiGlobe /> },
    { href: '/domains', label: 'Domains', icon: <FiDatabase /> },
    { href: '/accounts', label: 'Accounts', icon: <FiPieChart /> },
    { href: '/competitor', label: 'Competitor', icon: <FiGrid /> },
    { href: '/insights', label: 'Insights', icon: <FiAward /> },
  ];

  // Helper function to determine if a link is active
  const isLinkActive = (href: string) => {
    if (href === '/') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Wait until client-side hydration is complete before rendering
  if (!isMounted) {
    // Return a placeholder to ensure consistent UI structure
    return <div className="h-20"></div>;
  }

  return (
    <nav style={{ backgroundColor: navbarBgColor }} className="shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link 
              href="/"
              className="flex-shrink-0 flex items-center font-semibold text-lg text-white"
            >
              <span className="text-2xl font-bold">REDACTED</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const isActive = isLinkActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? `bg-primary text-white`
                        : 'text-white hover:text-white hover:bg-blue-600/20'
                    }`}
                  >
                    <span className="mr-1.5">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="md:hidden border-t border-gray-700">
        <div className="grid grid-cols-3 gap-1 p-2">
          {navItems.map((item) => {
            const isActive = isLinkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center px-2 py-2 rounded-md text-xs font-medium transition-colors duration-200 ${
                  isActive
                    ? `bg-primary text-white`
                    : 'text-white hover:text-white hover:bg-blue-600/20'
                }`}
              >
                <span className="text-lg mb-1">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}; 