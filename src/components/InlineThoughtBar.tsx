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
    <div className="my-4 p-4 rounded-2xl bg-black/55 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] text-stone-100 animate-in fade-in zoom-in-95 duration-150">
      {/* Top bar: Scope selector + Close */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mr-1 drop-shadow-xs">
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Inline Glass Co-Author</span>
          </span>

          {/* Scope Pills */}
          <div className="flex items-center bg-white/[0.08] backdrop-blur-md border border-white/10 p-0.5 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setScope('sentence')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                scope === 'sentence'
                  ? 'bg-white/20 text-white font-semibold shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
              title="Rewrite only this targeted sentence or phrase"
            >
              <AlignLeft className="w-3 h-3" />
              <span>Sentence</span>
            </button>
            <button
              type="button"
              onClick={() => setScope('paragraph')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                scope === 'paragraph'
                  ? 'bg-white/20 text-white font-semibold shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
              title="Rethink the whole paragraph to accommodate your note"
            >
              <FileText className="w-3 h-3" />
              <span>Paragraph</span>
            </button>
            <button
              type="button"
              onClick={() => setScope('article')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                scope === 'article'
                  ? 'bg-white/20 text-white font-semibold shadow-xs'
                  : 'text-stone-300 hover:text-white'
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
          className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selected text preview snippet */}
      {selectedText && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-xs font-serif italic text-stone-300 line-clamp-2">
          &ldquo;{selectedText}&rdquo;
        </div>
      )}

      {/* Preset Thought Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2 scrollbar-none">
        {PRESET_THOUGHTS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handlePresetClick(preset.prompt)}
            className="shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-stone-200 hover:text-amber-200 border border-white/10 backdrop-blur-md transition-colors shadow-xs"
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
                ? 'Tell your thought partner how to rewrite this line...'
                : scope === 'paragraph'
                ? 'How should we rethink this paragraph?'
                : 'What strategic shift should we weave across the whole piece?'
            }
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/15 focus:outline-none focus:ring-1 focus:ring-amber-400/60 focus:border-amber-400/60 text-xs text-white placeholder:text-stone-500 shadow-inner"
          />
          {feedback && (
            <button
              type="button"
              onClick={() => setFeedback('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!feedback.trim() || isLoading}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 active:to-amber-700 disabled:opacity-40 text-black font-semibold text-xs transition shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0"
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

      <div className="flex items-center justify-between text-[10px] text-stone-400 mt-2 px-1">
        <span>No need to copy-paste into chat. Gemini iterates right here.</span>
        <span>Scope: <strong className="text-amber-300">{scope}</strong></span>
      </div>
    </div>
  );
};
