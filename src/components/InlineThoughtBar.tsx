import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  X,
  FileText,
  AlignLeft,
  Globe,
  Loader2,
  Wand2,
} from 'lucide-react';
import type { IterationScope } from '../types/writing.ts';

interface InlineThoughtBarProps {
  selectedText: string;
  onIterate: (feedback: string, scope: IterationScope) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
  initialScope?: IterationScope;
}

const PRESET_THOUGHTS = [
  { label: 'Punchier & sharp', prompt: 'Make this more punchy, active, and impactful.' },
  { label: 'Cut 30% words', prompt: 'Condense and tighten this by ~30%, removing filler.' },
  { label: 'Add concrete example', prompt: 'Ground this point with a vivid, realistic example.' },
  { label: 'Smooth transition', prompt: 'Create a more natural, fluid narrative transition.' },
  { label: 'Executive tone', prompt: 'Elevate tone to authoritative, crisp executive voice.' },
  { label: 'Counter-argument', prompt: 'Introduce and address an insightful counter-perspective.' },
  { label: 'Simplify jargon', prompt: 'Explain this in plain, relatable language without jargon.' },
];

export const InlineThoughtBar: React.FC<InlineThoughtBarProps> = ({
  selectedText,
  onIterate,
  onClose,
  isLoading,
  initialScope = 'sentence',
}) => {
  const [scope, setScope] = useState<IterationScope>(initialScope);
  const [feedback, setFeedback] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!feedback.trim() || isLoading) return;
    onIterate(feedback.trim(), scope);
  };

  const handlePresetClick = (presetPrompt: string) => {
    setFeedback(presetPrompt);
    onIterate(presetPrompt, scope);
  };

  return (
    <div className="my-3 p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-300/80 dark:border-stone-700 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 transition-all text-stone-800 dark:text-stone-100 animate-in fade-in zoom-in-95 duration-150">
      {/* Top bar: Scope selector + Close */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 mr-1.5">
            <Wand2 className="w-3.5 h-3.5" />
            <span>Inline Co-Author</span>
          </span>

          {/* Scope Pills */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setScope('sentence')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                scope === 'sentence'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white font-semibold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
              title="Rewrite only this targeted sentence or phrase"
            >
              <AlignLeft className="w-3 h-3" />
              <span>Sentence</span>
            </button>
            <button
              type="button"
              onClick={() => setScope('paragraph')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                scope === 'paragraph'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white font-semibold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
              title="Rethink the whole paragraph to accommodate your note"
            >
              <FileText className="w-3 h-3" />
              <span>Paragraph</span>
            </button>
            <button
              type="button"
              onClick={() => setScope('article')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                scope === 'article'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white font-semibold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
              title="Weave this feedback smoothly across the entire draft"
            >
              <Globe className="w-3 h-3" />
              <span>Entire Article</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selected text preview snippet */}
      {selectedText && (
        <div className="mb-2.5 px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-950/60 border border-stone-200/70 dark:border-stone-800 text-xs font-serif italic text-stone-600 dark:text-stone-400 line-clamp-2">
          &ldquo;{selectedText}&rdquo;
        </div>
      )}

      {/* Preset Thought Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
        {PRESET_THOUGHTS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handlePresetClick(preset.prompt)}
            className="shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-full bg-stone-100 hover:bg-amber-100 hover:text-amber-900 dark:bg-stone-800 dark:hover:bg-amber-950/60 dark:hover:text-amber-200 text-stone-600 dark:text-stone-300 transition-colors border border-stone-200/60 dark:border-stone-700/60"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Feedback input form */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={isLoading}
            placeholder={
              scope === 'sentence'
                ? 'Tell your co-author how to rewrite this line...'
                : scope === 'paragraph'
                ? 'How should we rethink this paragraph?'
                : 'What strategic shift should we weave across the whole piece?'
            }
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-xs text-stone-900 dark:text-white placeholder:text-stone-400"
          />
          {feedback && (
            <button
              type="button"
              onClick={() => setFeedback('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              ×
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!feedback.trim() || isLoading}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white font-semibold text-xs transition shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Weaving...</span>
            </>
          ) : (
            <>
              <span>Weave Change</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      <div className="flex items-center justify-between text-[10px] text-stone-400 dark:text-stone-500 mt-2 px-1">
        <span>No need to copy-paste into chat. Gemini iterates right here.</span>
        <span>Scope: <strong>{scope}</strong></span>
      </div>
    </div>
  );
};
