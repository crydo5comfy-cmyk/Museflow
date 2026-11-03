import React, { useState } from 'react';
import {
  Sparkles,
  Feather,
  Share2,
  FilePlus,
  Maximize2,
  Minimize2,
  Columns,
  LogOut,
  ChevronDown,
  CloudCheck,
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton.tsx';
import type { User } from 'firebase/auth';

interface HeaderProps {
  title: string;
  onUpdateTitle: (title: string) => void;
  wordCount: number;
  readingTimeMinutes: number;
  viewMode: 'standard' | 'zen' | 'partner';
  onChangeViewMode: (mode: 'standard' | 'zen' | 'partner') => void;
  onOpenDraftStudio: () => void;
  onOpenWorkspaceModal: () => void;
  user: User | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  isSigningIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onUpdateTitle,
  wordCount,
  readingTimeMinutes,
  viewMode,
  onChangeViewMode,
  onOpenDraftStudio,
  onOpenWorkspaceModal,
  user,
  onSignIn,
  onSignOut,
  isSigningIn,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-stone-200/80 dark:border-stone-800 bg-white/80 dark:bg-stone-950/80 backdrop-blur-md px-4 flex items-center justify-between transition-colors">
      {/* Left: Brand & Document Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 pr-3 border-r border-stone-200 dark:border-stone-800 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 flex items-center justify-center text-white shadow-xs">
            <Feather className="w-4 h-4" />
          </div>
          <span className="font-serif font-black tracking-tight text-sm text-stone-900 dark:text-stone-100 hidden sm:inline">
            Museflow
          </span>
        </div>

        {/* Title editor */}
        <div className="min-w-0 flex items-center">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              className="px-2 py-0.5 font-serif font-medium text-sm text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-800 rounded-md border border-stone-300 dark:border-stone-700 outline-none w-56 sm:w-72"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempTitle(title);
                setIsEditingTitle(true);
              }}
              title="Click to rename"
              className="text-left font-serif font-medium text-sm text-stone-800 dark:text-stone-200 hover:text-amber-600 dark:hover:text-amber-400 truncate max-w-[160px] sm:max-w-xs px-1.5 py-0.5 rounded transition"
            >
              {title || 'Untitled Piece'}
            </button>
          )}
        </div>
      </div>

      {/* Middle: Writing telemetry stats */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
        <span className="flex items-center gap-1 font-mono">
          <strong className="text-stone-800 dark:text-stone-200">{wordCount}</strong> words
        </span>
        <span className="text-stone-300 dark:text-stone-700">•</span>
        <span>
          ~<strong className="text-stone-800 dark:text-stone-200">{readingTimeMinutes}</strong> min read
        </span>
        <span className="text-stone-300 dark:text-stone-700">•</span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <Sparkles className="w-3 h-3" />
          <span>Thought Partner Active</span>
        </span>
      </div>

      {/* Right: Actions, View Mode & Auth */}
      <div className="flex items-center gap-2">
        {/* View Mode controls */}
        <div className="hidden md:flex items-center bg-stone-100 dark:bg-stone-850 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => onChangeViewMode('zen')}
            className={`p-1.5 rounded-md transition ${
              viewMode === 'zen'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
            title="Zen Focus (Distraction Free)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('standard')}
            className={`p-1.5 rounded-md transition ${
              viewMode === 'standard'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
            title="Standard Canvas"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('partner')}
            className={`p-1.5 rounded-md transition ${
              viewMode === 'partner'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
            title="Split Thought Partner View"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </button>
        </div>

        {/* Start piece with AI */}
        <button
          type="button"
          onClick={onOpenDraftStudio}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 text-amber-800 dark:text-amber-300 font-semibold text-xs border border-amber-300/40 dark:border-amber-800/40 transition"
        >
          <FilePlus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span className="hidden sm:inline">Co-Author Piece</span>
        </button>

        {/* Workspace Sync & Export */}
        <button
          type="button"
          onClick={onOpenWorkspaceModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold border border-stone-200 dark:border-stone-700 transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Workspace</span>
        </button>

        {/* Auth / Profile menu */}
        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full object-cover border border-amber-500/30"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl py-2 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-stone-100 dark:border-stone-800">
                  <div className="font-semibold text-stone-900 dark:text-white truncate">
                    {user.displayName || 'Author'}
                  </div>
                  <div className="text-[11px] text-stone-400 truncate">{user.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onSignOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <GoogleSignInButton onClick={onSignIn} isLoading={isSigningIn} text="Connect" />
        )}
      </div>
    </header>
  );
};
