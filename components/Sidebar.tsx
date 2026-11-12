'use client';

import React from 'react';
import { User } from '@/types';
import {
  Home,
  Flame,
  Users,
  User as UserIcon,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  currentTab: 'all' | 'following' | 'trending';
  onSelectTab: (tab: 'all' | 'following' | 'trending') => void;
  currentUser: User | null;
  onViewProfile: (userId: string) => void;
  onResetData: () => void;
  isResetting: boolean;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  currentUser,
  onViewProfile,
  onResetData,
  isResetting,
}: SidebarProps) {
  const navItems = [
    {
      id: 'all' as const,
      label: 'Home Feed',
      icon: Home,
      desc: 'Chronological timeline',
    },
    {
      id: 'following' as const,
      label: 'Following',
      icon: Users,
      desc: 'People you follow',
    },
    {
      id: 'trending' as const,
      label: 'Trending',
      icon: Flame,
      desc: 'Most appreciated posts',
    },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-6 sticky top-20 self-start">
      {/* Primary Navigation Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-[#E8EFE9] text-[#243828] font-medium shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isActive ? 'bg-[#4F6F52] text-white' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm tracking-tight">{item.label}</div>
                  <div className="text-[11px] text-stone-400 truncate">{item.desc}</div>
                </div>
              </button>
            );
          })}

          {currentUser && (
            <button
              onClick={() => onViewProfile(currentUser._id)}
              className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-left text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-stone-100 text-stone-500">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm tracking-tight">My Profile</div>
                <div className="text-[11px] text-stone-400 truncate">@{currentUser.username}</div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Current User Quick Glance */}
      {currentUser && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.profilePicture}
              alt={currentUser.name}
              className="w-11 h-11 rounded-full object-cover border border-stone-200"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-stone-900 truncate">
                {currentUser.name}
              </h4>
              <p className="text-xs text-stone-500 truncate">
                @{currentUser.username}
              </p>
            </div>
          </div>

          {currentUser.bio && (
            <p className="mt-3 text-xs text-stone-600 line-clamp-2 leading-relaxed">
              {currentUser.bio}
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 text-center gap-2">
            <div>
              <span className="block text-sm font-semibold text-stone-900">
                {currentUser.followersCount ?? 0}
              </span>
              <span className="text-[11px] text-stone-400">Followers</span>
            </div>
            <div>
              <span className="block text-sm font-semibold text-stone-900">
                {currentUser.followingCount ?? 0}
              </span>
              <span className="text-[11px] text-stone-400">Following</span>
            </div>
          </div>
        </div>
      )}

      {/* Internship & Demo Details */}
      <div className="px-3 text-xs text-stone-400 space-y-2">
        <div className="flex items-center gap-2 text-stone-500 font-medium">
          <BookOpen className="w-3.5 h-3.5 text-[#4F6F52]" />
          <span>CodeAlpha Full Stack Task 2</span>
        </div>
        <p className="text-[11px] leading-relaxed text-stone-400">
          Built with Express REST architecture, MongoDB models, JWT auth & clean design.
        </p>

        <button
          onClick={onResetData}
          disabled={isResetting}
          className="inline-flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-600 transition-colors pt-1 disabled:opacity-50"
        >
          <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Resetting...' : 'Reset sample data'}</span>
        </button>
      </div>
    </aside>
  );
}
