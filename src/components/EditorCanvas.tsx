import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Wand2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Quote,
  List,
  AlignLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { InlineThoughtBar } from './InlineThoughtBar.tsx';
import { DiffViewer } from './DiffViewer.tsx';
import type { IterationResult, IterationScope, ProactiveSuggestion } from '../types/writing.ts';

interface EditorCanvasProps {
  content: string;
  onChangeContent: (newContent: string) => void;
  activeIteration: IterationResult | null;
  onAcceptIteration: () => void;
  onRejectIteration: () => void;
  onRefineIterationAgain: () => void;
  onTriggerIteration: (feedback: string, scope: IterationScope, targetSnippet: string) => Promise<void>;
  isIterating: boolean;
  proactiveSuggestions: ProactiveSuggestion[];
  onSelectProactiveSuggestion: (suggestion: ProactiveSuggestion) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  content,
  onChangeContent,
  activeIteration,
  onAcceptIteration,
  onRejectIteration,
  onRefineIterationAgain,
  onTriggerIteration,
  isIterating,
  proactiveSuggestions,
  onSelectProactiveSuggestion,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showThoughtBar, setShowThoughtBar] = useState(false);
  const [thoughtBarScope, setThoughtBarScope] = useState<IterationScope>('sentence');

  // Handle text selection in editor
  const handleSelect = () => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd } = textareaRef.current;
    if (selectionStart !== selectionEnd) {
      const text = textareaRef.current.value.slice(selectionStart, selectionEnd).trim();
      if (text.length > 3) {
        setSelectedText(text);
        setSelectionRange({ start: selectionStart, end: selectionEnd });
      }
    }
  };

  // Quick format insertion
  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = content.slice(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent = content.slice(0, start) + replacement + content.slice(end);
    onChangeContent(newContent);

    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected.length || 4)
      );
    }, 0);
  };

  // Trigger inline rewrite for current selection or whole paragraph
  const handleOpenThoughtBar = (scope: IterationScope = 'sentence') => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd } = textareaRef.current;

    if (selectionStart !== selectionEnd) {
      const text = content.slice(selectionStart, selectionEnd).trim();
      setSelectedText(text);
      setSelectionRange({ start: selectionStart, end: selectionEnd });
    } else {
      // Find current paragraph under cursor
      const cursor = selectionStart;
      const beforeCursor = content.slice(0, cursor);
      const afterCursor = content.slice(cursor);

      const paraStart = beforeCursor.lastIndexOf('\n\n') !== -1 ? beforeCursor.lastIndexOf('\n\n') + 2 : 0;
      const paraEndRel = afterCursor.indexOf('\n\n');
      const paraEnd = paraEndRel !== -1 ? cursor + paraEndRel : content.length;

      const paragraph = content.slice(paraStart, paraEnd).trim();
      setSelectedText(paragraph || content.slice(0, 150));
      setSelectionRange({ start: paraStart, end: paraEnd });
    }

    setThoughtBarScope(scope);
    setShowThoughtBar(true);
  };

  // Keyboard shortcut listener (Cmd/Ctrl + K or Alt + I)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleOpenThoughtBar('sentence');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(480, textareaRef.current.scrollHeight + 60)}px`;
    }
  }, [content]);

  return (
    <div className="relative w-full max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Floating Glass Formatting Bar */}
      <div className="sticky top-16 z-30 mb-6 flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/15 shadow-[0_15px_35px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
        <div className="flex items-center gap-1 text-stone-300">
          <button
            type="button"
            onClick={() => insertFormatting('## ')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition"
            title="Heading 2"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('### ')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition"
            title="Heading 3"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('**', '**')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('> ')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition"
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('- ')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition"
            title="Bullet list"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Thought Partner Quick Invocation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenThoughtBar('sentence')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-orange-500/20 hover:from-amber-500/35 hover:to-orange-500/30 text-amber-200 text-xs font-semibold border border-amber-400/35 backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.2)] transition"
            title="Select text and press to evolve with AI (Cmd+K)"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-300" />
            <span>Iterate with AI</span>
            <kbd className="hidden sm:inline font-mono text-[9px] bg-black/40 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      {/* Inline Thought Bar (when author requests inline iteration) */}
      {showThoughtBar && (
        <InlineThoughtBar
          selectedText={selectedText}
          isLoading={isIterating}
          initialScope={thoughtBarScope}
          onClose={() => setShowThoughtBar(false)}
          onIterate={async (feedback, scope) => {
            await onTriggerIteration(feedback, scope, selectedText);
            setShowThoughtBar(false);
          }}
        />
      )}

      {/* Active Diff Comparison View (when iteration result arrives) */}
      {activeIteration && (
        <div className="my-5">
          <DiffViewer
            originalText={activeIteration.originalText}
            revisedText={activeIteration.revisedText}
            explanation={activeIteration.explanation}
            diffSummary={activeIteration.diffSummary}
            scope={activeIteration.scope}
            onAccept={onAcceptIteration}
            onReject={onRejectIteration}
            onRefineAgain={onRefineIterationAgain}
            isLoading={isIterating}
          />
        </div>
      )}

      {/* Proactive ambient markers (quick chips above editor if any) */}
      {proactiveSuggestions.length > 0 && !activeIteration && (
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1 shrink-0 drop-shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>AI Sparks:</span>
          </span>
          {proactiveSuggestions.slice(0, 3).map((sug) => (
            <button
              key={sug.id}
              type="button"
              onClick={() => onSelectProactiveSuggestion(sug)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-stone-200 backdrop-blur-md transition shrink-0 shadow-xs"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="truncate max-w-[200px]">{sug.explanation}</span>
              <ChevronRight className="w-3 h-3 text-stone-400" />
            </button>
          ))}
        </div>
      )}

      {/* The Floating Frosted Glass Tablet Canvas */}
      <div className="relative min-h-[520px] rounded-3xl bg-black/35 backdrop-blur-2xl p-6 sm:p-12 border border-white/15 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all focus-within:border-amber-400/35 focus-within:shadow-[0_30px_80px_-15px_rgba(245,158,11,0.18)]">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
          onSelect={handleSelect}
          placeholder="Start writing freely, or click 'Co-Author' above to draft from a prompt and files. Highlight any sentence or paragraph to invite your AI thought partner inline..."
          className="w-full bg-transparent resize-none outline-none font-serif text-lg leading-relaxed text-stone-100 placeholder:text-stone-500 focus:outline-none selection:bg-amber-500/30 selection:text-amber-100 drop-shadow-xs"
          spellCheck={true}
        />
      </div>

      {/* Bottom helpful hint in frosted glass pill */}
      <div className="mt-4 flex items-center justify-between text-xs text-stone-400 px-3 py-2 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/10 font-serif">
        <span>💡 Highlight text or press <strong className="text-stone-200">⌘K</strong> to evolve inline</span>
        <span>Markdown headings (##), quotes (&gt;), and lists (-) supported</span>
      </div>
    </div>
  );
};
