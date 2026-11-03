import React, { useState } from 'react';
import { diffWordsWithSpace } from 'diff';
import { Columns2, Rows3, Check, X, Sparkles, RefreshCw } from 'lucide-react';

interface DiffViewerProps {
  originalText: string;
  revisedText: string;
  explanation?: string;
  diffSummary?: string;
  scope?: string;
  onAccept: () => void;
  onReject: () => void;
  onRefineAgain?: () => void;
  isLoading?: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalText,
  revisedText,
  explanation,
  diffSummary,
  scope,
  onAccept,
  onReject,
  onRefineAgain,
  isLoading = false,
}) => {
  const [viewMode, setViewMode] = useState<'inline' | 'split'>('inline');

  const wordDiff = diffWordsWithSpace(originalText || '', revisedText || '');

  return (
    <div className="rounded-2xl border border-white/20 bg-black/60 backdrop-blur-2xl shadow-[0_25px_60px_-10px_rgba(0,0,0,0.65),inset_0_1px_1px_0_rgba(255,255,255,0.25)] overflow-hidden p-4 text-stone-100 transition-all">
      {/* Header bar with rationale & view switch */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs shadow-xs">
            ✨
          </span>
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-amber-300 font-semibold drop-shadow-xs">
              Proposed Rewrite ({scope || 'Selection'})
            </span>
            {diffSummary && (
              <span className="ml-2 text-xs font-medium text-stone-400">
                — {diffSummary}
              </span>
            )}
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-white/[0.08] backdrop-blur-md border border-white/10 p-0.5 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setViewMode('inline')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              viewMode === 'inline'
                ? 'bg-white/20 font-semibold text-white shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Rows3 className="w-3.5 h-3.5" />
            <span>Inline Diff</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              viewMode === 'split'
                ? 'bg-white/20 font-semibold text-white shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Side by Side</span>
          </button>
        </div>
      </div>

      {/* Explanation pill */}
      {explanation && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-white/[0.05] backdrop-blur-md border border-white/10 text-xs text-stone-300 leading-relaxed shadow-inner">
          <strong className="text-amber-300">Thought partner rationale: </strong>
          {explanation}
        </div>
      )}

      {/* Diff Content Box */}
      <div className="rounded-xl bg-black/40 backdrop-blur-md p-4 border border-white/10 text-sm leading-relaxed max-h-80 overflow-y-auto font-serif shadow-inner">
        {viewMode === 'inline' ? (
          <div className="whitespace-pre-wrap select-text">
            {wordDiff.map((part, index) => {
              if (part.added) {
                return (
                  <span
                    key={index}
                    className="bg-emerald-500/25 text-emerald-200 border-b-2 border-emerald-400 font-medium px-1 rounded shadow-xs"
                  >
                    {part.value}
                  </span>
                );
              }
              if (part.removed) {
                return (
                  <span
                    key={index}
                    className="bg-rose-500/25 text-rose-300 line-through decoration-rose-400 px-1 rounded opacity-75 mr-0.5"
                  >
                    {part.value}
                  </span>
                );
              }
              return <span key={index}>{part.value}</span>;
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
            <div className="p-3 rounded-xl bg-rose-950/25 border border-rose-500/25 backdrop-blur-md">
              <div className="text-[10px] font-mono font-semibold uppercase text-rose-400 mb-1">
                Original Text
              </div>
              <div className="whitespace-pre-wrap text-stone-300">
                {originalText}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/25 backdrop-blur-md">
              <div className="text-[10px] font-mono font-semibold uppercase text-emerald-400 mb-1">
                Revised Version
              </div>
              <div className="whitespace-pre-wrap text-emerald-100 font-medium">
                {revisedText}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-3 mt-3.5 pt-2 border-t border-white/10">
        <div className="text-[11px] text-stone-400">
          Accepting weaves change into {scope || 'target'} in your draft.
        </div>
        <div className="flex items-center gap-2">
          {onRefineAgain && (
            <button
              type="button"
              onClick={onRefineAgain}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 backdrop-blur-md transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Another Take</span>
            </button>
          )}
          <button
            type="button"
            onClick={onReject}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Discard</span>
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:from-emerald-600 active:to-teal-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept Change</span>
          </button>
        </div>
      </div>
    </div>
  );
};
