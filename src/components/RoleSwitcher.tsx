'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { ShieldCheck, UserCheck, CheckCircle2, UserCog, ChevronDown } from 'lucide-react';

interface RoleSwitcherProps {
  initialUser?: User;
}

export function RoleSwitcher({ initialUser }: RoleSwitcherProps) {
  const [currentUser, setCurrentUser] = useState<User | undefined>(initialUser);
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.user) setCurrentUser(data.user);
        })
        .catch(console.error);
    }
  }, [currentUser]);

  const switchRole = async (role: UserRole) => {
    setIsSwitching(true);
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        setIsOpen(false);
        // Refresh to update server-rendered pages and RBAC states
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to switch role', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const rolesList: {
    role: UserRole;
    name: string;
    label: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      role: 'admin',
      name: 'Sarah Chen',
      label: 'Admin',
      desc: 'Brand Knowledge, Rules, Palette, Reset Demo',
      icon: <UserCog className="w-4 h-4 text-purple-600" />,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      role: 'creator',
      name: 'Alex Rivera',
      label: 'Creator',
      desc: 'Submit drafts, review highlights, accept/edit/dismiss findings',
      icon: <UserCheck className="w-4 h-4 text-emerald-600" />,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      role: 'manager',
      name: 'Marcus Vance',
      label: 'Manager',
      desc: 'Standard approval, request changes, comments, diffs',
      icon: <CheckCircle2 className="w-4 h-4 text-blue-600" />,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      role: 'reviewer',
      name: 'Dr. Elena Rostova',
      label: 'Reviewer (Legal)',
      desc: 'Required for approving claim & fact-sensitive content',
      icon: <ShieldCheck className="w-4 h-4 text-rose-600" />,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  const currentRoleConfig = rolesList.find((r) => r.role === currentUser?.role) || rolesList[1];

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Persona:
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isSwitching}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-cranberry-500/20 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-800 font-medium">{currentUser?.name || 'Loading...'}</span>
          <span className={`px-2 py-0.5 rounded-full border text-[11px] ${currentRoleConfig.color}`}>
            {currentRoleConfig.label}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-xl bg-white border border-slate-200 divide-y divide-slate-100 z-50 focus:outline-none">
          <div className="p-3 bg-slate-50 rounded-t-xl">
            <p className="text-xs font-semibold text-slate-800">1-Click Role Switcher (Judge Demo)</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Simulate any user persona without logging in. Permissions are verified on the server.
            </p>
          </div>

          <div className="p-1 space-y-1">
            {rolesList.map((item) => {
              const isSelected = item.role === currentUser?.role;
              return (
                <button
                  key={item.role}
                  onClick={() => switchRole(item.role)}
                  className={`w-full text-left p-2.5 rounded-lg flex items-start gap-3 transition-colors ${
                    isSelected ? 'bg-slate-100/80 ring-1 ring-slate-300' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-md bg-white border border-slate-200 shadow-xs">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-900">{item.name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${item.color}`}>
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-2 bg-slate-50 rounded-b-xl text-[11px] text-slate-400 text-center">
            Organization: Cranberry Labs Inc.
          </div>
        </div>
      )}
    </div>
  );
}
