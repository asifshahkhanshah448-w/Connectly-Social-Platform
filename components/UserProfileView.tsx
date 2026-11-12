'use client';

import React, { useState, useEffect } from 'react';
import { User, Post } from '@/types';
import PostCard from './PostCard';
import {
  Calendar,
  ArrowLeft,
  Edit3,
  UserPlus,
  UserCheck,
  FileText,
  Loader2,
} from 'lucide-react';

interface UserProfileViewProps {
  userId: string;
  currentUser: User | null;
  onBack: () => void;
  onOpenEditProfile: () => void;
  onOpenAuth: () => void;
  onFollowToggle: (userId: string, isCurrentlyFollowing: boolean) => void;
  onOpenFollowModal: (userId: string, mode: 'followers' | 'following', title: string) => void;
  onLikeToggle: (postId: string, isCurrentlyLiked: boolean) => void;
  onDeletePost: (postId: string) => void;
  onOpenEditPostModal: (post: Post) => void;
  onViewProfile: (userId: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  followingLoading: boolean;
}

export default function UserProfileView({
  userId,
  currentUser,
  onBack,
  onOpenEditProfile,
  onOpenAuth,
  onFollowToggle,
  onOpenFollowModal,
  onLikeToggle,
  onDeletePost,
  onOpenEditPostModal,
  onViewProfile,
  showToast,
  followingLoading,
}: UserProfileViewProps) {
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser?._id === userId;

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        setLoading(true);
        const token = localStorage.getItem('connectly_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Fetch user data
        const userRes = await fetch(`/api/users/${userId}`, { headers });
        const userData = await userRes.json();

        // Fetch user posts
        const postsRes = await fetch(`/api/posts?authorId=${userId}`, { headers });
        const postsData = await postsRes.json();

        if (isMounted) {
          if (userData.success) {
            setProfileUser(userData.user);
          }
          if (postsData.success) {
            setUserPosts(postsData.posts);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [userId, currentUser]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <Loader2 className="w-6 h-6 animate-spin text-[#4F6F52] mx-auto mb-3" />
        <p className="text-xs text-stone-500">Loading profile and journal entries...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-semibold text-stone-900">User not found</h3>
        <p className="text-xs text-stone-500 mt-1">
          The requested profile could not be located.
        </p>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#4F6F52] hover:bg-[#E8EFE9] rounded-lg transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Feed</span>
        </button>
      </div>
    );
  }

  const joinDate = new Date(profileUser.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        {/* Banner Cover with subtle organic styling */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-[#D6E3D8] via-[#E8EFEA] to-[#F0EBE3] relative">
          <button
            onClick={onBack}
            className="absolute top-4 left-4 p-2 rounded-xl bg-white/80 hover:bg-white text-stone-700 shadow-sm backdrop-blur-sm transition-all flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Feed</span>
          </button>
        </div>

        {/* Profile Info Header */}
        <div className="px-5 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            {/* Avatar */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profileUser.profilePicture}
              alt={profileUser.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
            />

            {/* Profile Action Button */}
            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <button
                  onClick={onOpenEditProfile}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-medium transition-colors shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                  <span>Edit Profile</span>
                </button>
              ) : currentUser ? (
                <button
                  onClick={() =>
                    onFollowToggle(profileUser._id, !!profileUser.isFollowing)
                  }
                  disabled={followingLoading}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-xs ${
                    profileUser.isFollowing
                      ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      : 'bg-[#4F6F52] hover:bg-[#3D5640] text-white shadow-[#4F6F52]/20'
                  } disabled:opacity-50`}
                >
                  {profileUser.isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-stone-600" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2 rounded-xl bg-[#4F6F52] hover:bg-[#3D5640] text-white text-xs font-medium transition-colors"
                >
                  Sign in to follow
                </button>
              )}
            </div>
          </div>

          {/* Name & Handle */}
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              {profileUser.name}
            </h2>
            <div className="text-xs text-stone-500 mt-0.5">
              @{profileUser.username}
            </div>
          </div>

          {/* Bio */}
          {profileUser.bio && (
            <p className="mt-3 text-sm text-stone-700 leading-relaxed max-w-xl">
              {profileUser.bio}
            </p>
          )}

          {/* Metadata Row */}
          <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-stone-500 pt-3 border-t border-stone-100">
            <div className="flex items-center gap-1.5 text-stone-500">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Joined {joinDate}</span>
            </div>

            <button
              onClick={() =>
                onOpenFollowModal(
                  profileUser._id,
                  'followers',
                  `${profileUser.name}'s Followers`
                )
              }
              className="hover:text-stone-900 transition-colors"
            >
              <strong className="text-stone-900 font-semibold">
                {profileUser.followersCount ?? 0}
              </strong>{' '}
              followers
            </button>

            <button
              onClick={() =>
                onOpenFollowModal(
                  profileUser._id,
                  'following',
                  `${profileUser.name}'s Following`
                )
              }
              className="hover:text-stone-900 transition-colors"
            >
              <strong className="text-stone-900 font-semibold">
                {profileUser.followingCount ?? 0}
              </strong>{' '}
              following
            </button>

            <div>
              <strong className="text-stone-900 font-semibold">
                {userPosts.length}
              </strong>{' '}
              posts
            </div>
          </div>
        </div>
      </div>

      {/* Profile Posts List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <FileText className="w-4 h-4 text-[#4F6F52]" />
          <h3 className="text-sm font-semibold text-stone-900">
            Published Reflections ({userPosts.length})
          </h3>
        </div>

        {userPosts.length > 0 ? (
          userPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={currentUser}
              onLikeToggle={onLikeToggle}
              onDeletePost={(deletedId) => {
                onDeletePost(deletedId);
                setUserPosts((prev) => prev.filter((p) => p._id !== deletedId));
              }}
              onOpenEditModal={onOpenEditPostModal}
              onViewProfile={onViewProfile}
              onOpenAuth={onOpenAuth}
              showToast={showToast}
            />
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200/80 p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <p className="text-xs text-stone-500">
              No posts published by @{profileUser.username} yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
