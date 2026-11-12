'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Rightbar from '@/components/Rightbar';
import CreatePostCard from '@/components/CreatePostCard';
import PostCard from '@/components/PostCard';
import UserProfileView from '@/components/UserProfileView';
import AuthModal from '@/components/AuthModal';
import EditProfileModal from '@/components/EditProfileModal';
import EditPostModal from '@/components/EditPostModal';
import FollowListModal from '@/components/FollowListModal';
import ToastContainer, { ToastMessage } from '@/components/Toast';
import { User, Post } from '@/types';
import {
  Sparkles,
  Flame,
  Users,
  Loader2,
  RefreshCw,
  PlusCircle,
  Home,
  User as UserIcon,
} from 'lucide-react';

export default function HomeFeedPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [feedTab, setFeedTab] = useState<'all' | 'following' | 'trending'>('all');
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [editPostTarget, setEditPostTarget] = useState<Post | null>(null);
  const [createPostScrollTrigger, setCreatePostScrollTrigger] = useState(0);

  // Follow Modal state
  const [followModal, setFollowModal] = useState<{
    isOpen: boolean;
    userId: string;
    mode: 'followers' | 'following';
    title: string;
  }>({
    isOpen: false,
    userId: '',
    mode: 'followers',
    title: '',
  });

  const [followingLoadingMap, setFollowingLoadingMap] = useState<Record<string, boolean>>({});
  const [isResetting, setIsResetting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Initial Load: Check Auth and Fetch Users
  const loadInitialData = useCallback(async () => {
    try {
      const token = localStorage.getItem('connectly_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      if (token) {
        try {
          const authRes = await fetch('/api/auth/me', { headers });
          const authData = await authRes.json();
          if (authData.success) {
            setCurrentUser(authData.user);
          } else {
            localStorage.removeItem('connectly_token');
            setCurrentUser(null);
          }
        } catch {
          // Keep null
        }
      }

      const usersRes = await fetch('/api/users', { headers });
      const usersData = await usersRes.json();
      if (usersData.success) {
        setAllUsers(usersData.users);
      }
    } catch (e) {
      console.error('Initial load error:', e);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      const token = localStorage.getItem('connectly_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      if (token) {
        try {
          const authRes = await fetch('/api/auth/me', { headers });
          const authData = await authRes.json();
          if (!ignore) {
            if (authData.success) {
              setCurrentUser(authData.user);
            } else {
              localStorage.removeItem('connectly_token');
              setCurrentUser(null);
            }
          }
        } catch {
          // Ignored
        }
      }

      try {
        const usersRes = await fetch('/api/users', { headers });
        const usersData = await usersRes.json();
        if (!ignore && usersData.success) {
          setAllUsers(usersData.users);
        }
      } catch (e) {
        console.error('Initial load error:', e);
      }
    };

    init();
    return () => {
      ignore = true;
    };
  }, []);

  // 2. Fetch Posts based on tab & viewer
  const fetchPosts = useCallback(async (tab: 'all' | 'following' | 'trending') => {
    try {
      setPostsLoading(true);
      const token = localStorage.getItem('connectly_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = '/api/posts';
      if (tab === 'trending') {
        url = '/api/posts?sort=trending';
      } else if (tab === 'following') {
        url = '/api/posts?followingOnly=true';
      }

      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      showToast('Could not load posts', 'error');
    } finally {
      setPostsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (viewingProfileId) return;
    let ignore = false;

    const loadPosts = async () => {
      const token = localStorage.getItem('connectly_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = '/api/posts';
      if (feedTab === 'trending') {
        url = '/api/posts?sort=trending';
      } else if (feedTab === 'following') {
        url = '/api/posts?followingOnly=true';
      }

      try {
        const res = await fetch(url, { headers });
        const data = await res.json();
        if (!ignore && data.success) {
          setPosts(data.posts);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        if (!ignore) {
          setPostsLoading(false);
        }
      }
    };

    loadPosts();
    return () => {
      ignore = true;
    };
  }, [feedTab, viewingProfileId, currentUser]);

  // 3. User Switcher / Demo login
  const handleSelectDemoUser = async (user: User) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: user.username, password: 'Password123!' }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('connectly_token', data.token);
        setCurrentUser(data.user);
        showToast(`Switched active profile to @${data.user.username}`, 'success');
        loadInitialData();
      }
    } catch (err) {
      console.error('Error switching demo user:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('connectly_token');
    setCurrentUser(null);
    showToast('Signed out of Connectly');
    loadInitialData();
  };

  // 4. Like / Unlike Handler
  const handleLikeToggle = async (postId: string, isCurrentlyLiked: boolean) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id === postId) {
          return {
            ...p,
            isLiked: !isCurrentlyLiked,
            likesCount: isCurrentlyLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
          };
        }
        return p;
      })
    );

    try {
      const token = localStorage.getItem('connectly_token');
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      const res = await fetch(`/api/posts/${postId}/like`, {
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              return {
                ...p,
                isLiked: isCurrentlyLiked,
                likesCount: isCurrentlyLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
              };
            }
            return p;
          })
        );
        showToast(data.message || 'Error updating like', 'error');
      }
    } catch (e) {
      console.error('Like toggle error:', e);
    }
  };

  // 5. Follow / Unfollow Handler
  const handleFollowToggle = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    setFollowingLoadingMap((prev) => ({ ...prev, [targetUserId]: true }));

    // Optimistic update
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u._id === targetUserId) {
          const countDiff = isCurrentlyFollowing ? -1 : 1;
          return {
            ...u,
            isFollowing: !isCurrentlyFollowing,
            followersCount: Math.max(0, (u.followersCount ?? 0) + countDiff),
          };
        }
        return u;
      })
    );

    setCurrentUser((prev) => {
      if (!prev) return null;
      const countDiff = isCurrentlyFollowing ? -1 : 1;
      return {
        ...prev,
        followingCount: Math.max(0, (prev.followingCount ?? 0) + countDiff),
      };
    });

    try {
      const token = localStorage.getItem('connectly_token');
      const method = isCurrentlyFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update follow');
      }

      showToast(
        isCurrentlyFollowing ? 'Unfollowed user' : 'Following user',
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating follow';
      showToast(msg, 'error');
      loadInitialData();
    } finally {
      setFollowingLoadingMap((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  // 6. Delete Post Handler
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to remove this post?')) return;

    try {
      const token = localStorage.getItem('connectly_token');
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete post');
      }

      setPosts((prev) => prev.filter((p) => p._id !== postId));
      showToast('Post removed', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting post';
      showToast(msg, 'error');
    }
  };

  // 7. Reset sample data
  const handleResetData = async () => {
    try {
      setIsResetting(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Sample dataset re-initialized', 'success');
        await loadInitialData();
        await fetchPosts(feedTab);
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 pb-20 sm:pb-12">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onSelectUser={handleSelectDemoUser}
        onViewProfile={(id) => setViewingProfileId(id)}
        onGoHome={() => {
          setViewingProfileId(null);
          setFeedTab('all');
        }}
        onOpenCreatePost={() => {
          setViewingProfileId(null);
          setCreatePostScrollTrigger((prev) => prev + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        allUsers={allUsers}
      />

      {/* Main Container Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex gap-8 items-start justify-center">
          {/* Left Navigation Sidebar */}
          <Sidebar
            currentTab={feedTab}
            onSelectTab={(tab) => {
              setViewingProfileId(null);
              setFeedTab(tab);
            }}
            currentUser={currentUser}
            onViewProfile={(id) => setViewingProfileId(id)}
            onResetData={handleResetData}
            isResetting={isResetting}
          />

          {/* Center Main Content Area */}
          <main className="flex-1 max-w-xl w-full space-y-5">
            {viewingProfileId ? (
              <UserProfileView
                userId={viewingProfileId}
                currentUser={currentUser}
                onBack={() => setViewingProfileId(null)}
                onOpenEditProfile={() => setEditProfileModalOpen(true)}
                onOpenAuth={() => setAuthModalOpen(true)}
                onFollowToggle={handleFollowToggle}
                onOpenFollowModal={(id, mode, title) =>
                  setFollowModal({ isOpen: true, userId: id, mode, title })
                }
                onLikeToggle={handleLikeToggle}
                onDeletePost={handleDeletePost}
                onOpenEditPostModal={(p) => setEditPostTarget(p)}
                onViewProfile={(id) => setViewingProfileId(id)}
                showToast={showToast}
                followingLoading={!!followingLoadingMap[viewingProfileId]}
              />
            ) : (
              <>
                {/* Mobile Tab Filter Bar */}
                <div className="lg:hidden flex items-center p-1 bg-stone-100 rounded-xl">
                  <button
                    onClick={() => setFeedTab('all')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                      feedTab === 'all'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Feed</span>
                  </button>
                  <button
                    onClick={() => setFeedTab('following')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                      feedTab === 'following'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Following</span>
                  </button>
                  <button
                    onClick={() => setFeedTab('trending')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                      feedTab === 'trending'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Trending</span>
                  </button>
                </div>

                {/* Post Creator Composer */}
                <div key={createPostScrollTrigger}>
                  <CreatePostCard
                    currentUser={currentUser}
                    onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
                    onOpenAuth={() => setAuthModalOpen(true)}
                    showToast={showToast}
                  />
                </div>

                {/* Feed Header / Status */}
                <div className="flex items-center justify-between px-1 pt-1 text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-800">
                      {feedTab === 'all'
                        ? 'Latest Feed'
                        : feedTab === 'following'
                        ? 'From Creators You Follow'
                        : 'Trending Discussions'}
                    </span>
                    <span className="text-stone-300">·</span>
                    <span>{posts.length} entries</span>
                  </div>

                  <button
                    onClick={() => fetchPosts(feedTab)}
                    className="p-1 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors"
                    title="Refresh feed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${postsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Posts List */}
                {postsLoading ? (
                  <div className="bg-white rounded-2xl border border-stone-200/80 p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <Loader2 className="w-6 h-6 animate-spin text-[#4F6F52] mx-auto mb-3" />
                    <p className="text-xs text-stone-500">Curating feed...</p>
                  </div>
                ) : posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard
                        key={post._id}
                        post={post}
                        currentUser={currentUser}
                        onLikeToggle={handleLikeToggle}
                        onDeletePost={handleDeletePost}
                        onOpenEditModal={(p) => setEditPostTarget(p)}
                        onViewProfile={(id) => setViewingProfileId(id)}
                        onOpenAuth={() => setAuthModalOpen(true)}
                        showToast={showToast}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-stone-200/80 p-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#E8EFE9] flex items-center justify-center text-[#4F6F52] mx-auto">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-stone-900">
                      {feedTab === 'following'
                        ? 'No posts from people you follow yet'
                        : 'Feed is quiet today'}
                    </h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      {feedTab === 'following'
                        ? 'Follow designers and writers from the suggestions column to populate your personal timeline.'
                        : 'Be the first to share a reflection or observation with the community.'}
                    </p>
                  </div>
                )}
              </>
            )}
          </main>

          {/* Right Sidebar */}
          <Rightbar
            users={allUsers}
            currentUser={currentUser}
            onFollowToggle={handleFollowToggle}
            onViewProfile={(id) => setViewingProfileId(id)}
            followingLoadingMap={followingLoadingMap}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-6 py-2.5 flex items-center justify-around">
        <button
          onClick={() => {
            setViewingProfileId(null);
            setFeedTab('all');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            !viewingProfileId && feedTab === 'all'
              ? 'text-[#4F6F52] font-semibold'
              : 'text-stone-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            setViewingProfileId(null);
            setFeedTab('trending');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            !viewingProfileId && feedTab === 'trending'
              ? 'text-[#4F6F52] font-semibold'
              : 'text-stone-500'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span>Trending</span>
        </button>

        <button
          onClick={() => {
            if (!currentUser) setAuthModalOpen(true);
            else {
              setViewingProfileId(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex flex-col items-center gap-1 text-[10px] text-[#4F6F52]"
        >
          <PlusCircle className="w-6 h-6" />
          <span>Post</span>
        </button>

        <button
          onClick={() => {
            if (currentUser) setViewingProfileId(currentUser._id);
            else setAuthModalOpen(true);
          }}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            viewingProfileId === currentUser?._id
              ? 'text-[#4F6F52] font-semibold'
              : 'text-stone-500'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span>{currentUser ? 'Profile' : 'Sign In'}</span>
        </button>
      </nav>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          loadInitialData();
          fetchPosts(feedTab);
        }}
        allUsers={allUsers}
        onSelectDemoUser={handleSelectDemoUser}
        showToast={showToast}
      />

      {currentUser && (
        <EditProfileModal
          isOpen={editProfileModalOpen}
          onClose={() => setEditProfileModalOpen(false)}
          currentUser={currentUser}
          onProfileUpdated={(updated) => {
            setCurrentUser(updated);
            loadInitialData();
          }}
          showToast={showToast}
        />
      )}

      <EditPostModal
        key={editPostTarget?._id || 'none'}
        isOpen={!!editPostTarget}
        post={editPostTarget}
        onClose={() => setEditPostTarget(null)}
        onPostUpdated={(updatedPost) => {
          setPosts((prev) =>
            prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
          );
        }}
        showToast={showToast}
      />

      <FollowListModal
        isOpen={followModal.isOpen}
        onClose={() => setFollowModal((prev) => ({ ...prev, isOpen: false }))}
        userId={followModal.userId}
        mode={followModal.mode}
        title={followModal.title}
        currentUser={currentUser}
        onFollowToggle={handleFollowToggle}
        onViewProfile={(id) => {
          setFollowModal((prev) => ({ ...prev, isOpen: false }));
          setViewingProfileId(id);
        }}
        followingLoadingMap={followingLoadingMap}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
