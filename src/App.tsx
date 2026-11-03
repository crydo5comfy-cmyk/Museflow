import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header.tsx';
import { EditorCanvas } from './components/EditorCanvas.tsx';
import { ProactiveMuse } from './components/ProactiveMuse.tsx';
import { DraftStudioModal } from './components/DraftStudioModal.tsx';
import { WorkspaceModal } from './components/WorkspaceModal.tsx';
import { initAuth, googleSignIn, logout } from './services/firebaseAuth.ts';
import {
  generateInitialDraft,
  iterateInline,
  fetchProactiveSuggestions,
} from './services/geminiClient.ts';
import type {
  WritingDoc,
  IterationResult,
  IterationScope,
  ProactiveSuggestion,
  AttachedFile,
} from './types/writing.ts';
import type { User } from 'firebase/auth';
import { Sparkles, Wand2, FilePlus, Share2 } from 'lucide-react';

const INITIAL_STARTER_DOC: WritingDoc = {
  id: 'starter-doc',
  title: 'The Architecture of Serendipity',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tone: 'Provocative & Insightful',
  format: 'Essay',
  content: `# The Architecture of Serendipity: Why Unstructured Thought Outlives the Metric

Most modern work systems are designed to eliminate variance. We build dashboards, optimize sprint velocities, and measure throughput with scientific precision. Yet the breakthrough ideas—the ones that fundamentally reshape industries or redefine how we live—almost never emerge from an optimized checklist.

They happen at the periphery. They occur when an architect wanders into a microbiology laboratory, or when an author accidentally stumbles across an obscure medieval manuscript while researching maritime trade routes.

## The Tyranny of the Immediate

When every minute is scheduled, serendipity is treated as a defect. We prioritize the urgent over the generative. But creativity is non-linear; it requires cognitive slack. True innovation requires the willingness to entertain questions that have no immediate commercial justification.

Consider how major discoveries were made: penicillin, the microwave, post-it notes, deep learning architectures. None began as a KPI in a quarterly review. They began as accidental observations by minds primed to notice anomalies.

## Designing Spaces for Accidental Collision

If we want more original work, we must deliberately engineer friction into our environments. We must read outside our domain, converse with people whose mental models contradict our own, and permit our thoughts to wander without an agenda.

The next generation of creative tools will not merely accelerate typing. They will act as true thought partners—challenging our implicit assumptions, offering unexpected counter-perspectives, and helping us weave divergent threads into a coherent, compelling tapestry.`,
};

export default function App() {
  // Document state
  const [doc, setDoc] = useState<WritingDoc>(() => {
    try {
      const saved = localStorage.getItem('museflow_active_doc');
      return saved ? JSON.parse(saved) : INITIAL_STARTER_DOC;
    } catch {
      return INITIAL_STARTER_DOC;
    }
  });

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Thought Partner / Iteration state
  const [activeIteration, setActiveIteration] = useState<IterationResult | null>(null);
  const [isIterating, setIsIterating] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<string>('');
  const [lastScope, setLastScope] = useState<IterationScope>('sentence');

  // Proactive Muse state
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [isAnalyzingProactive, setIsAnalyzingProactive] = useState(false);
  const [isAutoMuseEnabled, setIsAutoMuseEnabled] = useState(true);

  // Modals & UI view modes
  const [isDraftStudioOpen, setIsDraftStudioOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'zen' | 'partner'>('standard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save document locally whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('museflow_active_doc', JSON.stringify(doc));
    } catch (e) {
      console.warn('Could not save draft locally:', e);
    }
  }, [doc]);

  // Toast timer
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auth initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser) => {
        setUser(authenticatedUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        showToast('Connected to Google Workspace!');
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      showToast(err.message || 'Google Sign-In failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    showToast('Signed out of Google');
  };

  // Word count and reading time calculations
  const { wordCount, readingTimeMinutes } = useMemo(() => {
    const text = doc.content.trim();
    if (!text) return { wordCount: 0, readingTimeMinutes: 0 };
    const words = text.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { wordCount: words, readingTimeMinutes: minutes };
  }, [doc.content]);

  // Ambient Proactive Analysis (debounced when user pauses typing)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const runProactiveAnalysis = async (textToAnalyze: string) => {
    if (!textToAnalyze || textToAnalyze.length < 100) return;
    setIsAnalyzingProactive(true);
    try {
      const suggestions = await fetchProactiveSuggestions(textToAnalyze);
      setProactiveSuggestions(suggestions);
    } catch (err) {
      console.error('Proactive analysis error:', err);
    } finally {
      setIsAnalyzingProactive(false);
    }
  };

  useEffect(() => {
    if (!isAutoMuseEnabled) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      runProactiveAnalysis(doc.content);
    }, 4500);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [doc.content, isAutoMuseEnabled]);

  // Trigger initial analysis on first load for starter doc
  useEffect(() => {
    runProactiveAnalysis(doc.content);
  }, []);

  // Update doc title
  const handleUpdateTitle = (newTitle: string) => {
    setDoc((prev) => ({
      ...prev,
      title: newTitle,
      updatedAt: Date.now(),
    }));
  };

  // Update doc content
  const handleUpdateContent = (newContent: string) => {
    setDoc((prev) => ({
      ...prev,
      content: newContent,
      updatedAt: Date.now(),
    }));
  };

  // Generate initial draft from Prompt + Attached Files
  const handleGenerateDraft = async (params: {
    prompt: string;
    files: AttachedFile[];
    format: string;
    tone: string;
    targetLength: string;
    targetAudience: string;
    model: string;
  }) => {
    setIsIterating(true);
    try {
      const result = await generateInitialDraft(params);
      const raw = result.content;

      // Extract title from first markdown line if available
      let newTitle = doc.title;
      const titleMatch = raw.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        newTitle = titleMatch[1].trim();
      }

      setDoc({
        id: `doc-${Date.now()}`,
        title: newTitle || 'Co-Authored Piece',
        content: raw,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        format: params.format,
        tone: params.tone,
      });

      setIsDraftStudioOpen(false);
      showToast('New draft shaped by your thought partner!');

      // Run proactive scan on new draft
      setTimeout(() => runProactiveAnalysis(raw), 800);
    } catch (err: any) {
      console.error('Draft generation error:', err);
      showToast(err.message || 'Failed to generate piece');
    } finally {
      setIsIterating(false);
    }
  };

  // Trigger inline rewrite with scope (Sentence, Paragraph, or Article)
  const handleTriggerIteration = async (
    feedback: string,
    scope: IterationScope,
    targetSnippet: string
  ) => {
    setIsIterating(true);
    setLastFeedback(feedback);
    setLastScope(scope);

    try {
      const result = await iterateInline({
        fullText: doc.content,
        selectedText: targetSnippet,
        feedback,
        scope,
      });

      setActiveIteration(result);
    } catch (err: any) {
      console.error('Iteration error:', err);
      showToast(err.message || 'Failed to evolve text');
    } finally {
      setIsIterating(false);
    }
  };

  // Accept iteration change and weave into doc
  const handleAcceptIteration = () => {
    if (!activeIteration) return;

    if (activeIteration.scope === 'article') {
      // Replaces full article
      handleUpdateContent(activeIteration.revisedText);
    } else {
      // Replace specific target snippet
      const original = activeIteration.originalText;
      const revised = activeIteration.revisedText;

      if (doc.content.includes(original)) {
        const updated = doc.content.replace(original, revised);
        handleUpdateContent(updated);
      } else {
        // Fallback: append or inform
        handleUpdateContent(`${doc.content}\n\n${revised}`);
      }
    }

    setActiveIteration(null);
    showToast(`Wove in ${activeIteration.scope} rewrite cleanly!`);
  };

  // Reject / discard proposed rewrite
  const handleRejectIteration = () => {
    setActiveIteration(null);
  };

  // Try another take with same feedback
  const handleRefineIterationAgain = async () => {
    if (!activeIteration) return;
    await handleTriggerIteration(
      `${lastFeedback} (Provide an alternative take with fresh phrasing)`,
      lastScope,
      activeIteration.originalText
    );
  };

  // Select a proactive suggestion to review as a Diff
  const handleSelectProactiveSuggestion = (suggestion: ProactiveSuggestion) => {
    setActiveIteration({
      scope: suggestion.scope,
      originalText: suggestion.originalSnippet,
      revisedText: suggestion.suggestedSnippet,
      explanation: suggestion.explanation,
      diffSummary: `AI Proactive Spark (${suggestion.type})`,
    });
  };

  const handleDismissProactiveSuggestion = (id: string) => {
    setProactiveSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] dark:bg-[#141413] text-stone-900 dark:text-stone-100 selection:bg-amber-200 dark:selection:bg-amber-900 selection:text-amber-900 dark:selection:text-amber-100 font-sans">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        title={doc.title}
        onUpdateTitle={handleUpdateTitle}
        wordCount={wordCount}
        readingTimeMinutes={readingTimeMinutes}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onOpenDraftStudio={() => setIsDraftStudioOpen(true)}
        onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isSigningIn={isSigningIn}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left/Center: The Writing Canvas */}
        <div
          className={`flex-1 overflow-y-auto transition-all ${
            viewMode === 'zen' ? 'max-w-4xl mx-auto' : ''
          }`}
        >
          <EditorCanvas
            content={doc.content}
            onChangeContent={handleUpdateContent}
            activeIteration={activeIteration}
            onAcceptIteration={handleAcceptIteration}
            onRejectIteration={handleRejectIteration}
            onRefineIterationAgain={handleRefineIterationAgain}
            onTriggerIteration={handleTriggerIteration}
            isIterating={isIterating}
            proactiveSuggestions={proactiveSuggestions}
            onSelectProactiveSuggestion={handleSelectProactiveSuggestion}
          />
        </div>

        {/* Right Sidebar: Proactive Muse / Thought Partner Panel (hidden in Zen mode) */}
        {viewMode !== 'zen' && (
          <aside
            className={`transition-all duration-300 border-l border-stone-200/80 dark:border-stone-800 ${
              viewMode === 'partner' ? 'w-96' : 'w-80 hidden lg:block'
            }`}
          >
            <ProactiveMuse
              suggestions={proactiveSuggestions}
              isAnalyzing={isAnalyzingProactive}
              onSelectSuggestion={handleSelectProactiveSuggestion}
              onDismissSuggestion={handleDismissProactiveSuggestion}
              onTriggerAnalysis={() => runProactiveAnalysis(doc.content)}
              isAutoMuseEnabled={isAutoMuseEnabled}
              onToggleAutoMuse={() => setIsAutoMuseEnabled(!isAutoMuseEnabled)}
            />
          </aside>
        )}
      </main>

      {/* Co-Author New Piece Modal */}
      <DraftStudioModal
        isOpen={isDraftStudioOpen}
        onClose={() => setIsDraftStudioOpen(false)}
        onGenerate={handleGenerateDraft}
        isLoading={isIterating}
      />

      {/* Google Workspace Modal (Docs, Slides, Tasks, Gmail) */}
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        documentTitle={doc.title}
        documentContent={doc.content}
        user={user}
        onSignIn={handleSignIn}
        isSigningIn={isSigningIn}
      />
    </div>
  );
}
