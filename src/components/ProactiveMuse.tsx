import React from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  X,
  ChevronRight,
  Eye,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import type { ProactiveSuggestion } from '../types/writing.ts';

interface ProactiveMuseProps {
  suggestions: ProactiveSuggestion[];
  isAnalyzing: boolean;
  onSelectSuggestion: (suggestion: ProactiveSuggestion) => void;
  onDismissSuggestion: (id: string) => void;
  onTriggerAnalysis: () => void;
  isAutoMuseEnabled: boolean;
  onToggleAutoMuse: () => void;
}

export const ProactiveMuse: React.FC<ProactiveMuseProps> = ({
  suggestions,
  isAnalyzing,
  onSelectSuggestion,
  onDismissSuggestion,
  onTriggerAnalysis,
  isAutoMuseEnabled,
  onToggleAutoMuse,
}) => {
  const getBadgeForType = (type: ProactiveSuggestion['type']) => {
    switch (type) {
      case 'clarity':
        return {
          icon: <Zap className="w-3 h-3 text-sky-500" />,
          label: 'Clarity',
          bg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200/50 dark:border-sky-800/40',
        };
      case 'impact':
        return {
          icon: <TrendingUp className="w-3 h-3 text-amber-500" />,
          label: 'Impact',
          bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/40',
        };
      case 'argument':
        return {
          icon: <HelpCircle className="w-3 h-3 text-purple-500" />,
          label: 'Idea Anchor',
          bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/40',
        };
      case 'pacing':
        return {
          icon: <Sparkles className="w-3 h-3 text-emerald-500" />,
          label: 'Rhythm',
          bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/40',
        };
      default:
        return {
          icon: <Sparkles className="w-3 h-3 text-stone-500" />,
          label: 'Polish',
          bg: 'bg-stone-50 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700',
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50/50 dark:bg-stone-900/40 border-l border-stone-200/70 dark:border-stone-800/80 p-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-800 dark:text-stone-200">
              Proactive Thought Partner
            </h3>
            <p className="text-[10px] text-stone-400">Ambient inline suggestions as you write</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onTriggerAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-200/70 dark:bg-stone-800 hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-950/50 dark:hover:text-amber-200 text-stone-700 dark:text-stone-300 transition"
          title="Ask thought partner to review current draft"
        >
          {isAnalyzing ? (
            <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
          ) : (
            <Sparkles className="w-3 h-3 text-amber-500" />
          )}
          <span>{isAnalyzing ? 'Scanning...' : 'Scan Now'}</span>
        </button>
      </div>

      {/* Auto Muse Toggle Bar */}
      <div className="flex items-center justify-between py-2.5 px-2 my-2 rounded-lg bg-stone-100/70 dark:bg-stone-800/50 text-[11px] text-stone-600 dark:text-stone-300">
        <span>Continuous Ambient Muse</span>
        <button
          type="button"
          onClick={onToggleAutoMuse}
          className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
            isAutoMuseEnabled ? 'bg-amber-600' : 'bg-stone-300 dark:bg-stone-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isAutoMuseEnabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto space-y-3 py-1 pr-1">
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
              <Sparkles className="w-5 h-5 opacity-70" />
            </div>
            <p className="text-xs font-medium text-stone-600 dark:text-stone-300">
              {isAnalyzing ? 'Reviewing your prose...' : 'Flow is clear & resonant'}
            </p>
            <p className="text-[11px] text-stone-400 mt-1 max-w-[200px]">
              {isAnalyzing
                ? 'Looking for pacing, hooks, and clarity enhancements...'
                : 'As you write or edit, the co-author will quietly highlight inline opportunities here.'}
            </p>
          </div>
        ) : (
          suggestions.map((sug) => {
            const badge = getBadgeForType(sug.type);
            return (
              <div
                key={sug.id}
                className="group relative p-3 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700/60 transition-all text-left"
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}
                  >
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismissSuggestion(sug.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 transition"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Explanation */}
                <p className="text-xs font-medium text-stone-700 dark:text-stone-200 mb-2 leading-snug">
                  {sug.explanation}
                </p>

                {/* Target snippet */}
                <div className="mb-2 p-2 rounded-md bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800/60 text-[11px] font-serif italic text-stone-600 dark:text-stone-400 line-clamp-2">
                  &ldquo;{sug.originalSnippet}&rdquo;
                </div>

                {/* Interactive Action */}
                <button
                  type="button"
                  onClick={() => onSelectSuggestion(sug)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold transition"
                >
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>Review Diff & Weave</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
