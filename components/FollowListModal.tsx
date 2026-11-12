'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { X, UserPlus, UserCheck, Loader2 } from 'lucide-react';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  mode: 'followers' | 'following';
  title: string;
  currentUser: User | null;
  onFollowToggle: (targetId: string, isCurrentlyFollowing: boolean) => void;
  onViewProfile: (userId: string) => void;
  followingLoadingMap: Record<string, boolean>;
}

export default function FollowListModal({
  isOpen,
  onClose,
  userId,
  mode,
  title,
  currentUser,
  onFollowToggle,
  onViewProfile,
  followingLoadingMap,
}: FollowListModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const token = localStorage.getItem('connectly_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/users/${userId}/${mode}`, { headers });
        const data = await res.json();
        if (isMounted && data.success) {
          setUsers(mode === 'followers' ? data.followers : data.following);
        }
      } catch (err) {
        console.error('Error fetching follow list:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-stone-200 max-w-sm w-full p-5 shadow-2xl relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-sm font-bold text-stone-900 tracking-tight mb-1">
          {title}
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          {mode === 'followers'
            ? 'People following this creator'
            : 'Creators followed by this profile'}
        </p>

        {loading ? (
          <div className="py-8 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#4F6F52]" />
            <span>Loading connections...</span>
          </div>
        ) : users.length > 0 ? (
          <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 -mx-1 px-1">
            {users.map((u) => {
              const isCurrentUser = currentUser?._id === u._id;
              const isFollowing = !!u.isFollowing;
              const isLoading = !!followingLoadingMap[u._id];

              return (
                <div
                  key={u._id}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <button
                    onClick={() => {
                      onViewProfile(u._id);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 text-left min-w-0 hover:opacity-85 transition-opacity"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.profilePicture}
                      alt={u.name}
                      className="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-stone-900 truncate">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-stone-400 truncate">
                        @{u.username}
                      </div>
                    </div>
                  </button>

                  {!isCurrentUser && currentUser && (
                    <button
                      onClick={() => onFollowToggle(u._id, isFollowing)}
                      disabled={isLoading}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                        isFollowing
                          ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          : 'bg-[#4F6F52] text-white hover:bg-[#3D5640]'
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
        ) : (
          <div className="py-8 text-center text-xs text-stone-400">
            No {mode} found yet.
          </div>
        )}
      </div>
    </div>
  );
}
