import React, { useState } from 'react';
import {
  History,
  X,
  Camera,
  RotateCcw,
  Clock,
  Trash2,
  FileText,
  Columns2,
  Eye,
  Check,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { diffWordsWithSpace } from 'diff';
import { ConfirmationModal } from './ConfirmationModal.tsx';
import type { DocSnapshot } from '../types/writing.ts';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: DocSnapshot[];
  currentDocContent: string;
  currentDocTitle: string;
  onTakeSnapshot: (customLabel?: string) => void;
  onRevertToVersion: (snapshot: DocSnapshot) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  currentDocContent,
  currentDocTitle,
  onTakeSnapshot,
  onRevertToVersion,
  onDeleteSnapshot,
}) => {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(
    snapshots[0]?.id || ''
  );
  const [viewMode, setViewMode] = useState<'preview' | 'diff'>('diff');
  const [newSnapshotLabel, setNewSnapshotLabel] = useState('');
  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);

  // Confirmation state for reverting
  const [revertConfirmTarget, setRevertConfirmTarget] = useState<DocSnapshot | null>(null);

  if (!isOpen) return null;

  const selectedSnapshot =
    snapshots.find((s) => s.id === selectedSnapshotId) || snapshots[0] || null;

  // Format relative time
  const formatTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    onTakeSnapshot(newSnapshotLabel.trim() || undefined);
    setNewSnapshotLabel('');
    setIsTakingSnapshot(false);
  };

  const handleConfirmRevert = () => {
    if (revertConfirmTarget) {
      onRevertToVersion(revertConfirmTarget);
      setRevertConfirmTarget(null);
      onClose();
    }
  };

  const currentWordCount = currentDocContent.trim()
    ? currentDocContent.trim().split(/\s+/).filter(Boolean).length
    : 0;

  // Diff between selected snapshot and current editor content
  const wordDiff = selectedSnapshot
    ? diffWordsWithSpace(selectedSnapshot.content || '', currentDocContent || '')
    : [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-150">
        <div className="relative w-full max-w-5xl h-[88vh] flex flex-col rounded-3xl bg-black/65 backdrop-blur-2xl border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)] overflow-hidden text-stone-100">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shadow-xs">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-white">
                  Version History & Snapshots
                </h2>
                <p className="text-xs text-stone-400">
                  Track writing evolution, inspect side-by-side diffs, and restore previous drafts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTakingSnapshot(!isTakingSnapshot)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs shadow-[0_0_12px_rgba(245,158,11,0.3)] transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Save Snapshot</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-stone-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* New Snapshot input strip */}
          {isTakingSnapshot && (
            <form
              onSubmit={handleCreateSnapshot}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500/15 border-b border-amber-400/30 animate-in slide-in-from-top-1"
            >
              <input
                type="text"
                autoFocus
                value={newSnapshotLabel}
                onChange={(e) => setNewSnapshotLabel(e.target.value)}
                placeholder="Give this version a name (e.g. 'Before executive edit', 'Added stats')..."
                className="flex-1 px-3.5 py-1.5 rounded-xl bg-black/50 border border-white/20 text-xs text-white placeholder:text-stone-400 focus:ring-1 focus:ring-amber-400/60"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsTakingSnapshot(false)}
                className="px-2.5 py-1.5 text-xs text-stone-300 hover:text-white"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Main Content: Split List and Inspector */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Timeline List */}
            <div className="w-80 border-r border-white/10 flex flex-col bg-white/[0.02]">
              <div className="p-3.5 border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-stone-400 flex items-center justify-between">
                <span>{snapshots.length} Snapshots Saved</span>
                <span className="text-[10px] lowercase font-normal text-stone-500">
                  in localStorage
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                {snapshots.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-stone-400" />
                    <p>No snapshots saved yet.</p>
                    <p className="text-[10px] text-stone-400 mt-1">
                      Snapshots are automatically created before AI rewrites, or click &ldquo;Save
                      Snapshot&rdquo; anytime.
                    </p>
                  </div>
                ) : (
                  snapshots.map((snap) => {
                    const isSelected = snap.id === (selectedSnapshot?.id || '');
                    const wordDiffCount = snap.wordCount - currentWordCount;

                    return (
                      <div
                        key={snap.id}
                        onClick={() => setSelectedSnapshotId(snap.id)}
                        className={`group relative p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-400/15 border-amber-400/40 shadow-xs'
                            : 'bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white truncate max-w-[170px]">
                            {snap.label}
                          </span>
                          <span className="text-[10px] text-stone-400 shrink-0">
                            {formatTime(snap.timestamp)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-400">
                          <span>{snap.wordCount} words</span>
                          {wordDiffCount !== 0 && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                wordDiffCount > 0
                                  ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30'
                                  : 'text-stone-300 bg-white/10'
                              }`}
                            >
                              {wordDiffCount > 0 ? `+${wordDiffCount}` : wordDiffCount} words
                            </span>
                          )}
                        </div>

                        {/* Delete button on hover */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSnapshot(snap.id);
                          }}
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-400 transition"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Preview / Diff comparison */}
            <div className="flex-1 flex flex-col overflow-hidden bg-black/35 backdrop-blur-md">
              {selectedSnapshot ? (
                <>
                  {/* Sub-header with revert action & view toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-white/10 bg-white/[0.02]">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {selectedSnapshot.label}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        Saved {new Date(selectedSnapshot.timestamp).toLocaleString()} •{' '}
                        {selectedSnapshot.wordCount} words
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* View toggle */}
                      <div className="flex items-center bg-white/[0.08] backdrop-blur-md border border-white/10 p-0.5 rounded-xl text-xs">
                        <button
                          type="button"
                          onClick={() => setViewMode('diff')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                            viewMode === 'diff'
                              ? 'bg-white/20 font-semibold text-white shadow-xs'
                              : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          <Columns2 className="w-3.5 h-3.5" />
                          <span>Compare Diff</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('preview')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                            viewMode === 'preview'
                              ? 'bg-white/20 font-semibold text-white shadow-xs'
                              : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Snapshot Text</span>
                        </button>
                      </div>

                      {/* Revert Button */}
                      <button
                        type="button"
                        onClick={() => setRevertConfirmTarget(selectedSnapshot)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs shadow-[0_0_12px_rgba(245,158,11,0.3)] transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Revert to this Version</span>
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 overflow-y-auto p-6 font-serif text-sm leading-relaxed text-stone-200">
                    {viewMode === 'preview' ? (
                      <div className="whitespace-pre-wrap select-text max-w-3xl mx-auto text-stone-100">
                        {selectedSnapshot.content}
                      </div>
                    ) : (
                      <div className="max-w-3xl mx-auto">
                        <div className="mb-4 p-3 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-xs text-stone-300 flex items-center justify-between">
                          <span>
                            Comparing <strong className="text-white">Selected Snapshot</strong> → <strong className="text-amber-300">Current Draft</strong>
                          </span>
                          <span className="flex items-center gap-2 text-[11px]">
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Added recently
                            </span>
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 line-through">
                              Removed since
                            </span>
                          </span>
                        </div>

                        <div className="whitespace-pre-wrap select-text text-stone-900 dark:text-stone-100">
                          {wordDiff.map((part, idx) => {
                            if (part.added) {
                              return (
                                <span
                                  key={idx}
                                  className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-medium px-0.5 rounded underline decoration-emerald-400/60 decoration-2"
                                >
                                  {part.value}
                                </span>
                              );
                            }
                            if (part.removed) {
                              return (
                                <span
                                  key={idx}
                                  className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 line-through decoration-rose-500/80 px-0.5 rounded opacity-75 mr-0.5"
                                >
                                  {part.value}
                                </span>
                              );
                            }
                            return <span key={idx}>{part.value}</span>;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-stone-400">
                  Select a version from the left timeline to preview or compare changes.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revert Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!revertConfirmTarget}
        title="Revert to this Version?"
        message={`This will replace your current editor content with "${revertConfirmTarget?.label}". Don't worry: an automatic backup of your current draft will be taken immediately so you can always undo.`}
        confirmLabel="Revert Version"
        onConfirm={handleConfirmRevert}
        onCancel={() => setRevertConfirmTarget(null)}
      />
    </>
  );
};
