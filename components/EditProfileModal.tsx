'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { X, Loader2, Sparkles } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onProfileUpdated: (updatedUser: User) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
];

export default function EditProfileModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
  showToast,
}: EditProfileModalProps) {
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [profilePicture, setProfilePicture] = useState(currentUser.profilePicture);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('connectly_token');
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          profilePicture: profilePicture.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update profile');
      }

      onProfileUpdated(data.user);
      showToast('Profile updated successfully', 'success');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating profile';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-stone-200 max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-base font-bold text-stone-900 tracking-tight">
          Edit Profile
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Update your public profile details and avatar.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Avatar Preview & Presets */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">
              Profile Avatar
            </label>
            <div className="flex items-center gap-3 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profilePicture}
                alt="Selected avatar"
                className="w-12 h-12 rounded-full object-cover border border-stone-200"
              />
              <input
                type="url"
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
                placeholder="Image URL"
                className="flex-1 px-3 py-1.5 text-xs bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-[#4F6F52] focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mb-1.5">
              <Sparkles className="w-3 h-3 text-[#4F6F52]" />
              <span>Or choose an aesthetic preset:</span>
            </div>
            <div className="flex gap-2">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setProfilePicture(preset)}
                  className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
                    profilePicture === preset
                      ? 'border-[#4F6F52] scale-110 shadow-xs'
                      : 'border-transparent hover:border-stone-300'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preset} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-[#4F6F52] focus:outline-none transition-all"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={240}
              placeholder="Tell others about what you create..."
              className="w-full px-3 py-2 text-xs bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-[#4F6F52] focus:outline-none transition-all resize-none"
            />
            <div className="text-right text-[10px] text-stone-400 mt-0.5">
              {bio.length}/240
            </div>
          </div>

          {/* Buttons */}
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
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
