import React, { useState } from 'react';
import {
  Sparkles,
  Feather,
  Share2,
  FilePlus,
  Minimize2,
  Columns,
  LogOut,
  ChevronDown,
  History,
  Palette,
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
  onOpenVersionHistory: () => void;
  snapshotCount?: number;
  ambientMood?: 'aurora' | 'amber' | 'frost';
  onChangeAmbientMood?: (mood: 'aurora' | 'amber' | 'frost') => void;
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
  onOpenVersionHistory,
  snapshotCount = 0,
  ambientMood = 'aurora',
  onChangeAmbientMood,
  user,
  onSignIn,
  onSignOut,
  isSigningIn,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoodMenu, setShowMoodMenu] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
  };

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-white/10 bg-black/25 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.25)] px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Brand & Document Title */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex items-center gap-2 pr-3.5 border-r border-white/10 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/80 via-rose-500/80 to-indigo-500/80 p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <div className="w-full h-full rounded-[10px] bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
              <Feather className="w-4 h-4 text-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
            </div>
          </div>
          <span className="font-serif font-black tracking-tight text-sm text-white/95 hidden sm:inline drop-shadow-sm">
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
              className="px-2.5 py-1 font-serif font-medium text-sm text-white bg-white/10 backdrop-blur-md rounded-lg border border-white/20 outline-none w-56 sm:w-72 shadow-inner focus:ring-1 focus:ring-amber-400/50"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempTitle(title);
                setIsEditingTitle(true);
              }}
              title="Click to rename"
              className="text-left font-serif font-medium text-sm text-stone-200 hover:text-white truncate max-w-[160px] sm:max-w-xs px-2 py-1 rounded-lg hover:bg-white/5 transition border border-transparent hover:border-white/10"
            >
              {title || 'Untitled Piece'}
            </button>
          )}
        </div>
      </div>

      {/* Middle: Writing telemetry stats in subtle glass */}
      <div className="hidden lg:flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/10 text-xs text-stone-300">
        <span className="font-mono">
          <strong className="text-white font-semibold">{wordCount}</strong> words
        </span>
        <span className="text-white/20">·</span>
        <span>
          ~<strong className="text-white font-semibold">{readingTimeMinutes}</strong> min read
        </span>
        <span className="text-white/20">·</span>
        <span className="flex items-center gap-1 text-amber-300">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Glass Muse Active</span>
        </span>
      </div>

      {/* Right: Actions, View Mode & Auth */}
      <div className="flex items-center gap-2">
        {/* Glass Mood Preset Selector */}
        {onChangeAmbientMood && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoodMenu(!showMoodMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.18] text-stone-200 text-xs font-medium border border-white/15 backdrop-blur-md transition shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]"
              title="Change Glass Ambient Glow"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline capitalize">{ambientMood}</span>
            </button>

            {showMoodMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-stone-900/80 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] py-2 z-50 text-xs text-stone-200">
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                  Glass Caustic Mood
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onChangeAmbientMood('aurora');
                    setShowMoodMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/10 transition ${
                    ambientMood === 'aurora' ? 'text-amber-300 font-semibold bg-white/5' : ''
                  }`}
                >
                  <span>🌌 Midnight Aurora</span>
                  {ambientMood === 'aurora' && <span className="text-xs">✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeAmbientMood('amber');
                    setShowMoodMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/10 transition ${
                    ambientMood === 'amber' ? 'text-amber-300 font-semibold bg-white/5' : ''
                  }`}
                >
                  <span>🕯️ Smoked Amber</span>
                  {ambientMood === 'amber' && <span className="text-xs">✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeAmbientMood('frost');
                    setShowMoodMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/10 transition ${
                    ambientMood === 'frost' ? 'text-amber-300 font-semibold bg-white/5' : ''
                  }`}
                >
                  <span>🧊 Nordic Ice</span>
                  {ambientMood === 'frost' && <span className="text-xs">✓</span>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* View Mode controls */}
        <div className="hidden md:flex items-center bg-white/[0.06] backdrop-blur-md border border-white/10 p-0.5 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => onChangeViewMode('zen')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'zen'
                ? 'bg-white/20 text-white shadow-xs font-semibold'
                : 'text-stone-400 hover:text-white'
            }`}
            title="Zen Focus (Distraction Free)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('standard')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'standard'
                ? 'bg-white/20 text-white shadow-xs font-semibold'
                : 'text-stone-400 hover:text-white'
            }`}
            title="Standard Canvas"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('partner')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'partner'
                ? 'bg-white/20 text-white shadow-xs font-semibold'
                : 'text-stone-400 hover:text-white'
            }`}
            title="Split Thought Partner View"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

        {/* Start piece with AI */}
        <button
          type="button"
          onClick={onOpenDraftStudio}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-orange-500/20 hover:from-amber-500/35 hover:to-orange-500/30 text-amber-200 font-semibold text-xs border border-amber-400/30 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.15)] transition"
        >
          <FilePlus className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">Co-Author</span>
        </button>

        {/* Workspace Sync & Export */}
        <button
          type="button"
          onClick={onOpenWorkspaceModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-stone-200 text-xs font-semibold border border-white/15 backdrop-blur-md transition shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Workspace</span>
        </button>

        {/* Version History */}
        <button
          type="button"
          onClick={onOpenVersionHistory}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-stone-200 text-xs font-semibold border border-white/15 backdrop-blur-md transition shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]"
          title="Document Version History & Snapshots"
        >
          <History className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">History</span>
          {snapshotCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-400/25 text-amber-300 border border-amber-400/30">
              {snapshotCount}
            </span>
          )}
        </button>

        {/* Auth / Profile menu */}
        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-white/10 transition border border-transparent hover:border-white/15"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full object-cover border border-amber-400/40 shadow-xs"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-stone-900/85 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] py-2 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-white/10">
                  <div className="font-semibold text-white truncate">
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
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-white/10 transition text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <GoogleSignInButton
            onClick={onSignIn}
            isLoading={isSigningIn}
            text="Connect"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
          />
        )}
      </div>
    </header>
  );
};
