'use client';

import React, { useState } from 'react';
import { Post } from '@/types';
import { X, Loader2 } from 'lucide-react';

interface EditPostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: (updatedPost: Post) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function EditPostModal({
  post,
  isOpen,
  onClose,
  onPostUpdated,
  showToast,
}: EditPostModalProps) {
  const [content, setContent] = useState(post?.content || '');
  const [image, setImage] = useState(post?.image || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      showToast('Post content cannot be empty', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('connectly_token');
      const res = await fetch(`/api/posts/${post._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: content.trim(),
          image: image.trim() || '',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update post');
      }

      onPostUpdated(data.post);
      showToast('Post updated successfully', 'success');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating post';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-base font-bold text-stone-900 tracking-tight">
          Edit Post
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Revise your reflection or attached media.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 text-sm bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-[#4F6F52] focus:outline-none transition-all resize-none leading-relaxed"
              maxLength={2000}
            />
            <div className="text-right text-[10px] text-stone-400 mt-0.5">
              {content.length}/2000
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Image URL (optional)
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 text-xs bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-[#4F6F52] focus:outline-none transition-all"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-[#4F6F52] hover:bg-[#3D5640] text-white transition-all shadow-sm shadow-[#4F6F52]/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
