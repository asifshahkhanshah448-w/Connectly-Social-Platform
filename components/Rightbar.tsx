'use client';

import React from 'react';
import { User } from '@/types';
import { UserPlus, UserCheck, TrendingUp } from 'lucide-react';

interface RightbarProps {
  users: User[];
  currentUser: User | null;
  onFollowToggle: (userId: string, isCurrentlyFollowing: boolean) => void;
  onViewProfile: (userId: string) => void;
  followingLoadingMap: Record<string, boolean>;
}

export default function Rightbar({
  users,
  currentUser,
  onFollowToggle,
  onViewProfile,
  followingLoadingMap,
}: RightbarProps) {
  // Exclude current user from suggestions
  const suggestedUsers = users.filter((u) => u._id !== currentUser?._id).slice(0, 4);

  const trendingTopics = [
    { tag: '#minimalism', count: '1.4k posts' },
    { tag: '#architecture', count: '980 posts' },
    { tag: '#botanicals', count: '640 posts' },
    { tag: '#slowliving', count: '520 posts' },
    { tag: '#softwareCraft', count: '310 posts' },
  ];

  return (
    <aside className="w-80 shrink-0 hidden xl:flex flex-col gap-6 sticky top-20 self-start">
      {/* Suggested Users */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
            Who to follow
          </h3>
          <span className="text-[11px] text-stone-400">Discover</span>
        </div>

        <div className="divide-y divide-stone-50 mt-1">
          {suggestedUsers.map((user) => {
            const isLoading = !!followingLoadingMap[user._id];
            const isFollowing = !!user.isFollowing;

            return (
              <div
                key={user._id}
                className="py-3 flex items-center justify-between gap-3 group"
              >
                <button
                  onClick={() => onViewProfile(user._id)}
                  className="flex items-center gap-3 min-w-0 text-left hover:opacity-90 transition-opacity"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border border-stone-200"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-stone-900 truncate group-hover:text-[#4F6F52] transition-colors">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-stone-400 truncate">
                      @{user.username}
                    </div>
                  </div>
                </button>

                {currentUser && (
                  <button
                    onClick={() => onFollowToggle(user._id, isFollowing)}
                    disabled={isLoading}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                      isFollowing
                        ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        : 'bg-[#4F6F52] text-white hover:bg-[#3D5640] shadow-xs'
                    } disabled:opacity-50`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3 h-3 text-stone-600" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trending Community Topics */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <TrendingUp className="w-4 h-4 text-[#4F6F52]" />
          <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
            Trending Discussions
          </h3>
        </div>

        <div className="space-y-3 mt-3">
          {trendingTopics.map((item) => (
            <div
              key={item.tag}
              className="flex items-center justify-between text-xs hover:bg-stone-50 p-1.5 -mx-1.5 rounded-lg cursor-pointer transition-colors"
            >
              <div className="font-medium text-stone-800">{item.tag}</div>
              <div className="text-[11px] text-stone-400">{item.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Footer */}
      <div className="px-2 text-[11px] text-stone-400 leading-relaxed">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span>Connectly v1.0</span>
          <span>·</span>
          <span>Privacy</span>
          <span>·</span>
          <span>Terms</span>
          <span>·</span>
          <span>REST API</span>
        </div>
        <p className="mt-2 text-stone-400/80">
          Crafted for intentional digital connection.
        </p>
      </div>
    </aside>
  );
}
