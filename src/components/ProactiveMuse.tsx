import React from 'react';
import {
  Sparkles,
  Zap,
  TrendingUp,
  HelpCircle,
  X,
  ChevronRight,
  Eye,
  Loader2,
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
          icon: <Zap className="w-3 h-3 text-sky-400" />,
          label: 'Clarity',
          bg: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
        };
      case 'impact':
        return {
          icon: <TrendingUp className="w-3 h-3 text-amber-400" />,
          label: 'Impact',
          bg: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
        };
      case 'argument':
        return {
          icon: <HelpCircle className="w-3 h-3 text-purple-400" />,
          label: 'Idea Anchor',
          bg: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
        };
      case 'pacing':
        return {
          icon: <Sparkles className="w-3 h-3 text-emerald-400" />,
          label: 'Rhythm',
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
        };
      default:
        return {
          icon: <Sparkles className="w-3 h-3 text-stone-400" />,
          label: 'Polish',
          bg: 'bg-white/10 text-stone-200 border-white/20',
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/25 backdrop-blur-2xl border-l border-white/10 p-4 select-none text-stone-100 shadow-[inset_1px_0_0_0_rgba(255,255,255,0.06)]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              Proactive Glass Muse
            </h3>
            <p className="text-[10px] text-stone-400">Ambient inline thoughts as you write</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onTriggerAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 text-stone-200 hover:text-white backdrop-blur-md transition shadow-xs"
          title="Ask thought partner to review current draft"
        >
          {isAnalyzing ? (
            <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
          ) : (
            <Sparkles className="w-3 h-3 text-amber-400" />
          )}
          <span>{isAnalyzing ? 'Scanning...' : 'Scan Now'}</span>
        </button>
      </div>

      {/* Auto Muse Toggle Bar in Frosted Glass */}
      <div className="flex items-center justify-between py-2 px-3 my-2.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-[11px] text-stone-300">
        <span>Continuous Ambient Muse</span>
        <button
          type="button"
          onClick={onToggleAutoMuse}
          className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-white/20 transition-colors duration-200 ease-in-out focus:outline-hidden ${
            isAutoMuseEnabled ? 'bg-amber-500' : 'bg-white/15'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
              isAutoMuseEnabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto space-y-3 py-1 pr-1">
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/15 flex items-center justify-center text-amber-300 mb-2 shadow-inner">
              <Sparkles className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-xs font-medium text-stone-200">
              {isAnalyzing ? 'Reviewing your prose...' : 'Flow is clear & resonant'}
            </p>
            <p className="text-[11px] text-stone-400 mt-1 max-w-[200px]">
              {isAnalyzing
                ? 'Looking for pacing, hooks, and clarity enhancements...'
                : 'As you write, the thought partner surfaces suggestions here.'}
            </p>
          </div>
        ) : (
          suggestions.map((sug) => {
            const badge = getBadgeForType(sug.type);
            return (
              <div
                key={sug.id}
                className="group relative p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-400/40 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.12)] transition-all text-left"
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md ${badge.bg}`}
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
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-white p-0.5 transition"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Explanation */}
                <p className="text-xs font-medium text-stone-200 mb-2 leading-snug">
                  {sug.explanation}
                </p>

                {/* Target snippet */}
                <div className="mb-2.5 p-2 rounded-xl bg-black/40 border border-white/10 text-[11px] font-serif italic text-stone-300 line-clamp-2">
                  &ldquo;{sug.originalSnippet}&rdquo;
                </div>

                {/* Interactive Action */}
                <button
                  type="button"
                  onClick={() => onSelectSuggestion(sug)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold border border-amber-400/30 transition shadow-xs"
                >
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
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
