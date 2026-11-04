'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RoleSwitcher } from './RoleSwitcher';
import { Compass, RotateCcw, Shield, FileCheck, Layers, BarChart3, Info } from 'lucide-react';
import { User } from '@/lib/types';

export function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(console.error);
  }, []);

  const handleResetDemo = async () => {
    if (!confirm('Are you sure you want to reset all data to the initial Cranberry Labs seed?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset-demo', { method: 'POST' });
      if (res.ok) {
        setResetSuccess(true);
        setTimeout(() => {
          setResetSuccess(false);
          window.location.reload();
        }, 1200);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reset demo data');
      }
    } catch {
      alert('Network error resetting demo');
    } finally {
      setIsResetting(false);
    }
  };

  const navLinks = [
    { href: '/submit', label: 'Submit Draft', icon: FileCheck },
    { href: '/submissions', label: 'Review', icon: Compass },
    { href: '/approvals', label: 'Approvals', icon: Shield },
    { href: '/admin/knowledge', label: 'Brand Knowledge', icon: Layers },
    { href: '/insights', label: 'Insights', icon: BarChart3 },
    { href: '/ai-disclosure', label: 'AI Transparency', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cranberry-600 to-cranberry-800 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-base tracking-tight leading-tight flex items-center gap-1.5">
                  TrueNorth
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cranberry-100 text-cranberry-800 border border-cranberry-200">
                    Judge Demo
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Cranberry Labs Inc.</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-cranberry-50 text-cranberry-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions: Reset button (Admin only) + Role Switcher */}
          <div className="flex items-center gap-3">
            {currentUser?.role === 'admin' && (
              <button
                onClick={handleResetDemo}
                disabled={isResetting || resetSuccess}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors"
                title="Reset database to initial seed data"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                {resetSuccess ? 'Reset Done!' : 'Reset Demo'}
              </button>
            )}

            <RoleSwitcher initialUser={currentUser} />
          </div>
        </div>
      </div>
    </header>
  );
}

