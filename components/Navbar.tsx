'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/types';
import {
  Search,
  Compass,
  Plus,
  LogOut,
  UserCheck,
  ChevronDown,
  Sparkles,
  X,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSelectUser: (user: User) => void;
  onViewProfile: (userId: string) => void;
  onGoHome: () => void;
  onOpenCreatePost: () => void;
  allUsers: User[];
}

export default function Navbar({
  currentUser,
  onOpenAuth,
  onLogout,
  onSelectUser,
  onViewProfile,
  onGoHome,
  onOpenCreatePost,
  allUsers,
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Filtered users for search
  const filteredUsers = searchQuery.trim()
    ? allUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 group text-left transition-opacity hover:opacity-90"
          >
            <div className="w-9 h-9 rounded-xl bg-[#4F6F52] flex items-center justify-center text-white shadow-sm shadow-[#4F6F52]/20 group-hover:scale-105 transition-transform">
              <span className="font-serif font-bold text-lg leading-none">C</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-semibold tracking-tight text-stone-900 leading-none">
                Connectly
              </span>
              <span className="text-[10px] tracking-wider uppercase text-[#4F6F52] font-medium mt-0.5">
                Social Platform
              </span>
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Search creators, designers, engineers..."
              className="w-full pl-10 pr-9 py-2 bg-stone-100/80 hover:bg-stone-100 focus:bg-white text-sm text-stone-900 rounded-xl border border-transparent focus:border-stone-300 focus:outline-none transition-all placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-stone-200 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-2 text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                People ({filteredUsers.length})
              </div>
              {filteredUsers.length > 0 ? (
                <div className="max-h-72 overflow-y-auto divide-y divide-stone-50">
                  {filteredUsers.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => {
                        onViewProfile(user._id);
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-stone-50 text-left transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover border border-stone-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-900 truncate">
                          {user.name}
                        </div>
                        <div className="text-xs text-stone-500 truncate">
                          @{user.username}
                        </div>
                      </div>
                      <span className="text-xs text-[#4F6F52] font-medium">View</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-xs text-stone-500">
                  No users found matching &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Navigation & User Actions */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <>
              {/* New Post Button */}
              <button
                onClick={onOpenCreatePost}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#4F6F52] hover:bg-[#3D5640] text-white text-xs font-medium transition-all shadow-sm shadow-[#4F6F52]/20 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Post</span>
              </button>

              {/* User Dropdown */}
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentUser.profilePicture}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-stone-300"
                  />
                  <span className="text-xs font-medium text-stone-800 hidden md:inline truncate max-w-[100px]">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-stone-200 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* User Info Header */}
                    <div className="p-3.5 border-b border-stone-100 bg-[#FAF9F6]">
                      <div className="text-sm font-semibold text-stone-900 truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-xs text-stone-500 truncate">
                        @{currentUser.username}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5 truncate">
                        {currentUser.email}
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="p-1.5 divide-y divide-stone-100">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            onViewProfile(currentUser._id);
                            setShowUserDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-xs text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-lg flex items-center gap-2.5 transition-colors"
                        >
                          <Compass className="w-4 h-4 text-stone-400" />
                          View My Profile
                        </button>
                      </div>

                      {/* Demo Account Switcher */}
                      <div className="py-1">
                        <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400 flex items-center justify-between">
                          <span>Switch Account</span>
                          <Sparkles className="w-3 h-3 text-[#4F6F52]" />
                        </div>
                        {allUsers.map((u) => (
                          <button
                            key={u._id}
                            onClick={() => {
                              onSelectUser(u);
                              setShowUserDropdown(false);
                            }}
                            className={`w-full px-3 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors ${
                              u._id === currentUser._id
                                ? 'bg-[#E8EFE9] text-[#2D4530] font-medium'
                                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                            }`}
                          >
                            <span className="truncate">@{u.username}</span>
                            {u._id === currentUser._id && (
                              <UserCheck className="w-3.5 h-3.5 text-[#4F6F52]" />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            onLogout();
                          }}
                          className="w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2.5 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-[#4F6F52] hover:bg-[#3D5640] text-white text-xs font-medium transition-all shadow-sm shadow-[#4F6F52]/20 active:scale-95"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
