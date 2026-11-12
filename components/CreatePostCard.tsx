'use client';

import React, { useState, useRef } from 'react';
import { User, Post } from '@/types';
import { Image as ImageIcon, Send, Sparkles, X, Loader2 } from 'lucide-react';

interface CreatePostCardProps {
  currentUser: User | null;
  onPostCreated: (post: Post) => void;
  onOpenAuth: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const PRESET_IMAGES = [
  {
    name: 'Kyoto Light',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Nordic Studio',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Botanical Leaf',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Stone & Shadow',
    url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function CreatePostCard({
  currentUser,
  onPostCreated,
  onOpenAuth,
  showToast,
}: CreatePostCardProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (PNG, JPG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
        setShowPresets(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!content.trim()) {
      showToast('Please write something before publishing', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('connectly_token');
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content,
          image: imageUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create post');
      }

      setContent('');
      setImageUrl('');
      setShowPresets(false);
      onPostCreated(data.post);
      showToast('Post published to feed', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating post';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-semibold text-stone-900">
          Join the conversation on Connectly
        </h3>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          Sign in to share your thoughts, publish reflections, and follow fellow creators.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F6F52] hover:bg-[#3D5640] text-white text-xs font-medium transition-all shadow-sm shadow-[#4F6F52]/20"
        >
          Sign In or Create Account
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="flex gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUser.profilePicture}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What are you exploring, observing, or crafting today?"
              className="w-full bg-transparent text-sm text-stone-900 placeholder:text-stone-400 border-0 focus:outline-none focus:ring-0 resize-none leading-relaxed"
              maxLength={2000}
            />
          </div>
        </div>

        {/* Attached Image Preview */}
        {imageUrl && (
          <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100 max-h-72">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Post preview"
              className="w-full h-auto max-h-72 object-cover"
            />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Preset Image Chooser Dropdown */}
        {showPresets && (
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span className="font-medium">Curated aesthetic photography:</span>
              <button
                type="button"
                onClick={() => setShowPresets(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setImageUrl(preset.url);
                    setShowPresets(false);
                  }}
                  className="group relative rounded-lg overflow-hidden border border-stone-200 aspect-video hover:border-[#4F6F52] transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-end p-1">
                    <span className="text-[10px] text-white font-medium truncate">
                      {preset.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {/* File Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-[#4F6F52]" />
              <span>Photo</span>
            </button>

            {/* Presets Button */}
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Presets</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-[11px] ${
                content.length > 1800 ? 'text-amber-600 font-medium' : 'text-stone-400'
              }`}
            >
              {content.length}/2000
            </span>

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4F6F52] hover:bg-[#3D5640] text-white text-xs font-medium transition-all shadow-sm shadow-[#4F6F52]/20 disabled:opacity-40 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
