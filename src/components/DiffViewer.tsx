import React, { useState } from 'react';
import { diffWordsWithSpace, diffLines } from 'diff';
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
    <div className="rounded-xl border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/50 dark:bg-stone-900/80 backdrop-blur-md shadow-xl overflow-hidden p-4 text-stone-800 dark:text-stone-100 transition-all">
      {/* Header bar with rationale & view switch */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-200/80 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs">
            ✨
          </span>
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-amber-700 dark:text-amber-400 font-semibold">
              Proposed Rewrite ({scope || 'Selection'})
            </span>
            {diffSummary && (
              <span className="ml-2 text-xs font-medium text-stone-500 dark:text-stone-400">
                — {diffSummary}
              </span>
            )}
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-stone-800/80 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setViewMode('inline')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              viewMode === 'inline'
                ? 'bg-white dark:bg-stone-700 font-medium text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Rows3 className="w-3.5 h-3.5" />
            <span>Inline Diff</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              viewMode === 'split'
                ? 'bg-white dark:bg-stone-700 font-medium text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Side by Side</span>
          </button>
        </div>
      </div>

      {/* Explanation pill */}
      {explanation && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-white/70 dark:bg-stone-800/60 border border-stone-200/50 dark:border-stone-700/50 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          <strong className="text-stone-800 dark:text-stone-200">Thought partner rationale: </strong>
          {explanation}
        </div>
      )}

      {/* Diff Content */}
      <div className="rounded-lg bg-white dark:bg-stone-950 p-3.5 border border-stone-200/70 dark:border-stone-800 text-sm leading-relaxed max-h-80 overflow-y-auto font-serif">
        {viewMode === 'inline' ? (
          <div className="whitespace-pre-wrap select-text">
            {wordDiff.map((part, index) => {
              if (part.added) {
                return (
                  <span
                    key={index}
                    className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-medium px-0.5 rounded underline decoration-emerald-400/60 decoration-2"
                  >
                    {part.value}
                  </span>
                );
              }
              if (part.removed) {
                return (
                  <span
                    key={index}
                    className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 line-through decoration-rose-500/80 px-0.5 rounded opacity-75 mr-0.5"
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
            <div className="p-2.5 rounded bg-rose-50/50 dark:bg-stone-900 border border-rose-100 dark:border-stone-800">
              <div className="text-[10px] font-mono font-semibold uppercase text-rose-700 dark:text-rose-400 mb-1">
                Original Text
              </div>
              <div className="whitespace-pre-wrap text-stone-700 dark:text-stone-300">
                {originalText}
              </div>
            </div>
            <div className="p-2.5 rounded bg-emerald-50/50 dark:bg-stone-900 border border-emerald-100 dark:border-stone-800">
              <div className="text-[10px] font-mono font-semibold uppercase text-emerald-700 dark:text-emerald-400 mb-1">
                Revised Version
              </div>
              <div className="whitespace-pre-wrap text-stone-900 dark:text-stone-100 font-medium">
                {revisedText}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-3 mt-3.5 pt-2 border-t border-stone-200/60 dark:border-stone-800/80">
        <div className="text-[11px] text-stone-500 dark:text-stone-400">
          Accepting replaces {scope || 'target'} in your draft.
        </div>
        <div className="flex items-center gap-2">
          {onRefineAgain && (
            <button
              type="button"
              onClick={onRefineAgain}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Another Take</span>
            </button>
          )}
          <button
            type="button"
            onClick={onReject}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Discard</span>
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept Change</span>
          </button>
        </div>
      </div>
    </div>
  );
};
