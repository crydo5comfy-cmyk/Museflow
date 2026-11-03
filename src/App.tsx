import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header.tsx';
import { EditorCanvas } from './components/EditorCanvas.tsx';
import { ProactiveMuse } from './components/ProactiveMuse.tsx';
import { DraftStudioModal } from './components/DraftStudioModal.tsx';
import { WorkspaceModal } from './components/WorkspaceModal.tsx';
import { VersionHistoryModal } from './components/VersionHistoryModal.tsx';
import { initAuth, googleSignIn, logout } from './services/firebaseAuth.ts';
import {
  generateInitialDraft,
  iterateInline,
  fetchProactiveSuggestions,
} from './services/geminiClient.ts';
import {
  getDocSnapshots,
  saveDocSnapshot,
  deleteDocSnapshot,
} from './services/versionHistory.ts';
import type {
  WritingDoc,
  IterationResult,
  IterationScope,
  ProactiveSuggestion,
  AttachedFile,
  DocSnapshot,
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
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'zen' | 'partner'>('standard');
  const [ambientMood, setAmbientMood] = useState<'aurora' | 'amber' | 'frost'>('aurora');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Version snapshots state
  const [snapshots, setSnapshots] = useState<DocSnapshot[]>(() => getDocSnapshots(doc.id));

  // Ensure an initial snapshot exists on first load
  useEffect(() => {
    const existing = getDocSnapshots(doc.id);
    if (existing.length === 0) {
      const initial = saveDocSnapshot(doc, 'Initial Draft State', true);
      setSnapshots([initial]);
    } else {
      setSnapshots(existing);
    }
  }, [doc.id]);

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

    // Save auto-checkpoint before applying AI iteration
    saveDocSnapshot(
      doc,
      `Before AI rewrite: ${activeIteration.diffSummary || activeIteration.scope}`,
      true
    );
    setSnapshots(getDocSnapshots(doc.id));

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

  // Snapshot handlers
  const handleTakeSnapshot = (customLabel?: string) => {
    const snap = saveDocSnapshot(doc, customLabel || undefined, false);
    setSnapshots(getDocSnapshots(doc.id));
    showToast(`Saved snapshot "${snap.label}"`);
  };

  const handleRevertToVersion = (snapshot: DocSnapshot) => {
    // Save safety checkpoint of current draft before reverting
    saveDocSnapshot(doc, `Backup before restoring: ${snapshot.label}`, true);
    setDoc((prev) => ({
      ...prev,
      title: snapshot.title || prev.title,
      content: snapshot.content,
      updatedAt: Date.now(),
    }));
    setSnapshots(getDocSnapshots(doc.id));
    showToast(`Restored version: "${snapshot.label}"`);
  };

  const handleDeleteSnapshot = (snapshotId: string) => {
    const updated = deleteDocSnapshot(doc.id, snapshotId);
    setSnapshots(updated);
    showToast('Snapshot removed');
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
    <div className="min-h-screen flex flex-col bg-[#08080C] text-stone-100 selection:bg-amber-400/30 selection:text-amber-200 font-sans relative overflow-x-hidden">
      {/* Dynamic Ambient Glass Glow Orbs (Visible through all translucent glass surfaces) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {ambientMood === 'aurora' && (
          <>
            <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-700/30 via-purple-600/20 to-pink-500/15 filter blur-[120px] animate-float-1" />
            <div className="absolute top-1/4 -right-40 w-[640px] h-[640px] rounded-full bg-gradient-to-bl from-amber-500/20 via-orange-600/15 to-violet-600/20 filter blur-[140px] animate-float-2" />
            <div className="absolute -bottom-40 left-1/3 w-[620px] h-[620px] rounded-full bg-gradient-to-t from-teal-500/15 via-sky-600/15 to-indigo-700/20 filter blur-[130px] animate-float-3" />
          </>
        )}
        {ambientMood === 'amber' && (
          <>
            <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-amber-600/35 via-yellow-500/25 to-orange-700/20 filter blur-[120px] animate-float-1" />
            <div className="absolute top-1/3 -right-40 w-[640px] h-[640px] rounded-full bg-gradient-to-bl from-orange-500/25 via-amber-700/20 to-rose-600/15 filter blur-[130px] animate-float-2" />
            <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-t from-yellow-600/20 via-amber-800/20 to-stone-900 filter blur-[120px] animate-float-3" />
          </>
        )}
        {ambientMood === 'frost' && (
          <>
            <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-600/25 via-sky-500/20 to-indigo-600/15 filter blur-[120px] animate-float-1" />
            <div className="absolute top-1/4 -right-40 w-[640px] h-[640px] rounded-full bg-gradient-to-bl from-blue-500/20 via-indigo-600/15 to-teal-500/15 filter blur-[130px] animate-float-2" />
            <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-t from-sky-600/15 via-slate-600/15 to-indigo-900/20 filter blur-[120px] animate-float-3" />
          </>
        )}
        {/* Soft radial sheen */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))]" />
      </div>

      {/* Toast alert with frosted glass styling */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/20 text-white text-xs font-semibold shadow-[0_15px_35px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header with see-through glass */}
      <Header
        title={doc.title}
        onUpdateTitle={handleUpdateTitle}
        wordCount={wordCount}
        readingTimeMinutes={readingTimeMinutes}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        ambientMood={ambientMood}
        onChangeAmbientMood={setAmbientMood}
        onOpenDraftStudio={() => setIsDraftStudioOpen(true)}
        onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
        snapshotCount={snapshots.length}
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

      {/* Version History & Snapshots Modal */}
      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        snapshots={snapshots}
        currentDocContent={doc.content}
        currentDocTitle={doc.title}
        onTakeSnapshot={handleTakeSnapshot}
        onRevertToVersion={handleRevertToVersion}
        onDeleteSnapshot={handleDeleteSnapshot}
      />
    </div>
  );
}
