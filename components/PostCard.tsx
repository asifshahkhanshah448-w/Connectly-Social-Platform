'use client';

import React, { useState } from 'react';
import { Post, User, Comment } from '@/types';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Edit2,
  Trash2,
  Send,
  Loader2,
  CornerDownRight,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onLikeToggle: (postId: string, isCurrentlyLiked: boolean) => void;
  onDeletePost: (postId: string) => void;
  onOpenEditModal: (post: Post) => void;
  onViewProfile: (userId: string) => void;
  onOpenAuth: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'recently';
  }
}

export default function PostCard({
  post,
  currentUser,
  onLikeToggle,
  onDeletePost,
  onOpenEditModal,
  onViewProfile,
  onOpenAuth,
  showToast,
}: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [isLiking, setIsLiking] = useState(false);

  const isOwnPost = currentUser?._id === post.author._id;

  const handleFetchComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }

    setShowComments(true);
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
        setCommentsCount(data.comments.length);
      }
    } catch (e) {
      console.error('Error fetching comments:', e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!commentText.trim()) return;

    try {
      setCommentSubmitting(true);
      const token = localStorage.getItem('connectly_token');
      const res = await fetch(`/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: commentText }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit comment');
      }

      setComments((prev) => [...prev, data.comment]);
      setCommentsCount((prev) => prev + 1);
      setCommentText('');
      showToast('Comment posted', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding comment';
      showToast(msg, 'error');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem('connectly_token');
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete comment');
      }

      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
      showToast('Comment deleted', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting comment';
      showToast(msg, 'error');
    }
  };

  const handleLikeClick = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    await onLikeToggle(post._id, post.isLiked);
    setIsLiking(false);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.origin);
    showToast('Link copied to clipboard', 'success');
  };

  return (
    <article className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:border-stone-300/80">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={() => onViewProfile(post.author._id)}
          className="flex items-center gap-3 text-left group min-w-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.author.profilePicture}
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover border border-stone-200"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-900 group-hover:text-[#4F6F52] transition-colors truncate">
                {post.author.name}
              </span>
              <span className="text-xs text-stone-400 shrink-0">·</span>
              <span className="text-xs text-stone-400 shrink-0">
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>
            <div className="text-xs text-stone-500 truncate">
              @{post.author.username}
            </div>
          </div>
        </button>

        {/* Post Options Menu */}
        {isOwnPost && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl border border-stone-200 shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenEditModal(post);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-stone-400" />
                  <span>Edit Post</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDeletePost(post._id);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="mt-3.5 text-sm text-stone-800 leading-relaxed whitespace-pre-line font-normal">
        {post.content}
      </div>

      {/* Post Image */}
      {post.image && (
        <div className="mt-3.5 rounded-xl overflow-hidden border border-stone-100 bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image}
            alt="Post media"
            className="w-full h-auto max-h-[500px] object-cover hover:scale-[1.01] transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
        <div className="flex items-center gap-5">
          {/* Like Button */}
          <button
            onClick={handleLikeClick}
            disabled={isLiking}
            className={`flex items-center gap-1.5 transition-colors group ${
              post.isLiked ? 'text-rose-600 font-medium' : 'hover:text-rose-600'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                post.isLiked ? 'fill-rose-600 text-rose-600' : 'text-stone-400'
              }`}
            />
            <span>{post.likesCount}</span>
          </button>

          {/* Comment Toggle Button */}
          <button
            onClick={handleFetchComments}
            className={`flex items-center gap-1.5 transition-colors group ${
              showComments ? 'text-[#4F6F52] font-medium' : 'hover:text-[#4F6F52]'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-stone-400 group-hover:text-[#4F6F52] transition-colors" />
            <span>{commentsCount}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 transition-colors"
          title="Share post"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-stone-100 space-y-3.5 animate-in fade-in duration-200">
          {/* Add Comment Input */}
          {currentUser ? (
            <form onSubmit={handleAddComment} className="flex gap-2.5 items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUser.profilePicture}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-stone-200 shrink-0"
              />
              <div className="relative flex-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a thoughtful reply..."
                  className="w-full pl-3 pr-10 py-1.5 text-xs bg-stone-50 focus:bg-white rounded-lg border border-stone-200 focus:border-[#4F6F52] focus:outline-none transition-all placeholder:text-stone-400"
                  maxLength={600}
                />
                <button
                  type="submit"
                  disabled={commentSubmitting || !commentText.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-[#4F6F52] hover:text-[#3D5640] disabled:opacity-30 transition-colors"
                >
                  {commentSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-2 text-xs text-stone-500 bg-stone-50 rounded-lg">
              <button
                onClick={onOpenAuth}
                className="text-[#4F6F52] font-medium hover:underline"
              >
                Sign in
              </button>{' '}
              to join the discussion
            </div>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <div className="flex items-center justify-center py-4 text-xs text-stone-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#4F6F52]" />
              <span>Loading reflections...</span>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {comments.map((comment) => {
                const isOwnComment = currentUser?._id === comment.author._id;
                return (
                  <div
                    key={comment._id}
                    className="flex items-start gap-2.5 group p-2 rounded-lg hover:bg-stone-50/70 transition-colors"
                  >
                    <CornerDownRight className="w-3.5 h-3.5 text-stone-300 mt-1 shrink-0" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={comment.author.profilePicture}
                      alt={comment.author.name}
                      onClick={() => onViewProfile(comment.author._id)}
                      className="w-6 h-6 rounded-full object-cover border border-stone-200 shrink-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onViewProfile(comment.author._id)}
                            className="text-xs font-semibold text-stone-900 hover:text-[#4F6F52] truncate"
                          >
                            {comment.author.name}
                          </button>
                          <span className="text-[11px] text-stone-400 truncate">
                            @{comment.author.username}
                          </span>
                          <span className="text-[11px] text-stone-400">·</span>
                          <span className="text-[10px] text-stone-400 shrink-0">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>

                        {isOwnComment && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-500 transition-opacity p-0.5"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-stone-700 mt-0.5 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-stone-400">
              No replies yet. Be the first to start the conversation!
            </div>
          )}
        </div>
      )}
    </article>
  );
}
