'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { X, Lock, Mail, User as UserIcon, Loader2, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, token: string) => void;
  allUsers: User[];
  onSelectDemoUser: (user: User) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  allUsers,
  onSelectDemoUser,
  showToast,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('connectly_token', data.token);
      onAuthSuccess(data.user, data.token);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error logging in';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username,
          email,
          password,
          bio,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('connectly_token', data.token);
      onAuthSuccess(data.user, data.token);
      showToast('Account created successfully!', 'success');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error registering';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-stone-200 max-w-md w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#4F6F52] flex items-center justify-center text-white mx-auto mb-2 font-serif font-bold text-lg">
            C
          </div>
          <h2 className="text-lg font-bold text-stone-900 tracking-tight">
            {mode === 'login' ? 'Sign in to Connectly' : 'Create your account'}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {mode === 'login'
              ? 'Connect with creators and share thoughtful insights'
              : 'Join the community of designers, engineers, and thinkers'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="elena@connectly.app or elena_arch"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-[#4F6F52] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-[#4F6F52] focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#4F6F52] hover:bg-[#3D5640] text-white text-xs font-medium transition-all shadow-sm shadow-[#4F6F52]/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Elena Rostova"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-[#4F6F52] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="elena_arch"
                  className="w-full px-3 py-2 text-xs bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-[#4F6F52] focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elena@mail.com"
                  className="w-full px-3 py-2 text-xs bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-[#4F6F52] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 text-xs bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-[#4F6F52] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Short Bio (optional)
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Designer & writer exploring slow living..."
                className="w-full px-3 py-2 text-xs bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-[#4F6F52] focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#4F6F52] hover:bg-[#3D5640] text-white text-xs font-medium transition-all shadow-sm shadow-[#4F6F52]/20 disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Account'}
            </button>
          </form>
        )}

        {/* Toggle Mode */}
        <div className="mt-4 pt-3 border-t border-stone-100 text-center text-xs text-stone-500">
          {mode === 'login' ? (
            <span>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                }}
                className="text-[#4F6F52] font-semibold hover:underline"
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
                className="text-[#4F6F52] font-semibold hover:underline"
              >
                Sign in
              </button>
            </span>
          )}
        </div>

        {/* 1-Click Demo Account Quick Login */}
        <div className="mt-4 pt-3 border-t border-dashed border-stone-200">
          <div className="flex items-center justify-between text-[11px] font-medium text-stone-500 mb-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#4F6F52]" />
              <span>Instant Test Switcher:</span>
            </span>
            <span className="text-stone-400">Password: Password123!</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {allUsers.slice(0, 4).map((u) => (
              <button
                key={u._id}
                type="button"
                onClick={() => {
                  onSelectDemoUser(u);
                  onClose();
                }}
                className="px-2.5 py-1.5 bg-stone-50 hover:bg-[#E8EFE9] rounded-lg text-left text-xs transition-colors border border-stone-200/80 flex items-center gap-2 group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={u.profilePicture}
                  alt={u.name}
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
                <span className="truncate text-stone-700 group-hover:text-[#2D4530]">
                  @{u.username}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
