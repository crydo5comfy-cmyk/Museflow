import React, { useState } from 'react';
import {
  X,
  FileText,
  Presentation,
  CheckSquare,
  Mail,
  ExternalLink,
  Loader2,
  Sparkles,
  Check,
  Plus,
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton.tsx';
import { ConfirmationModal } from './ConfirmationModal.tsx';
import {
  createGoogleDoc,
  createGoogleSlidesPresentation,
  createGoogleTasks,
  createGmailDraft,
} from '../services/workspaceApi.ts';
import { getSlideOutline, extractTasks } from '../services/geminiClient.ts';
import type { SlideItem, TaskItem } from '../types/writing.ts';
import type { User } from 'firebase/auth';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentContent: string;
  user: User | null;
  onSignIn: () => Promise<void>;
  isSigningIn: boolean;
}

type TabType = 'docs' | 'slides' | 'tasks' | 'gmail';

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  documentContent,
  user,
  onSignIn,
  isSigningIn,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('docs');

  // Confirmation modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmAction: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmAction: async () => {},
  });

  // Action states
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successLink, setSuccessLink] = useState<{ text: string; url: string } | null>(null);

  // Slides state
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [slidesOutline, setSlidesOutline] = useState<SlideItem[]>([]);

  // Tasks state
  const [isExtractingTasks, setIsExtractingTasks] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<TaskItem[]>([]);

  // Gmail state
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState(documentTitle || 'Draft from Museflow');

  if (!isOpen) return null;

  const handleOpenDocsConfirm = () => {
    setErrorMsg(null);
    setSuccessLink(null);
    setConfirmConfig({
      isOpen: true,
      title: 'Export to Google Docs?',
      message: `This will create a new Google Doc titled "${documentTitle || 'Untitled Draft'}" in your Google Drive with your draft content.`,
      confirmAction: async () => {
        setIsExporting(true);
        try {
          const res = await createGoogleDoc(documentTitle, documentContent);
          setSuccessLink({ text: 'Google Doc created successfully! Click to open.', url: res.url });
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to export to Google Docs');
        } finally {
          setIsExporting(false);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleGenerateSlides = async () => {
    setIsGeneratingSlides(true);
    setErrorMsg(null);
    try {
      const outline = await getSlideOutline(documentContent, documentTitle);
      setSlidesOutline(outline.slides || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate slide outline');
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  const handleOpenSlidesConfirm = () => {
    if (slidesOutline.length === 0) {
      setErrorMsg('Please generate slide outline first.');
      return;
    }
    setErrorMsg(null);
    setSuccessLink(null);
    setConfirmConfig({
      isOpen: true,
      title: 'Create Google Slides Presentation?',
      message: `This will create a new Google Slides presentation with ${slidesOutline.length} structured slides in your Google Drive.`,
      confirmAction: async () => {
        setIsExporting(true);
        try {
          const res = await createGoogleSlidesPresentation(documentTitle, slidesOutline);
          setSuccessLink({
            text: 'Google Slides presentation created! Click to open in Slides.',
            url: res.url,
          });
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to export to Google Slides');
        } finally {
          setIsExporting(false);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleExtractTasks = async () => {
    setIsExtractingTasks(true);
    setErrorMsg(null);
    try {
      const tasks = await extractTasks(documentContent);
      setExtractedTasks(tasks);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to extract tasks');
    } finally {
      setIsExtractingTasks(false);
    }
  };

  const toggleTaskSelected = (index: number) => {
    setExtractedTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleOpenTasksConfirm = () => {
    const selected = extractedTasks.filter((t) => t.selected);
    if (selected.length === 0) {
      setErrorMsg('Please select at least one task to sync.');
      return;
    }
    setErrorMsg(null);
    setSuccessLink(null);
    setConfirmConfig({
      isOpen: true,
      title: 'Sync to Google Tasks?',
      message: `This will add ${selected.length} action item(s) to your primary Google Tasks list.`,
      confirmAction: async () => {
        setIsExporting(true);
        try {
          const res = await createGoogleTasks(selected);
          setSuccessLink({
            text: `Synced ${res.count} task(s) to "${res.listTitle}"! Check Google Tasks.`,
            url: 'https://tasks.google.com',
          });
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to sync Google Tasks');
        } finally {
          setIsExporting(false);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleOpenGmailConfirm = () => {
    setErrorMsg(null);
    setSuccessLink(null);
    setConfirmConfig({
      isOpen: true,
      title: 'Create Gmail Draft?',
      message: `This will create a new draft email in your Gmail account with the subject "${emailSubject}".`,
      confirmAction: async () => {
        setIsExporting(true);
        try {
          const res = await createGmailDraft(emailSubject, documentContent, emailTo);
          setSuccessLink({
            text: 'Gmail draft created successfully! Click to review in Gmail.',
            url: res.url,
          });
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to create Gmail draft');
        } finally {
          setIsExporting(false);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-150">
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-black/65 backdrop-blur-2xl border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)] p-6 text-stone-100">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div>
              <h2 className="text-base font-serif font-bold text-white">
                Google Workspace Integrations
              </h2>
              <p className="text-xs text-stone-400">
                Connect your writing directly to Google Docs, Slides, Tasks, and Gmail.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Auth Banner if not signed in */}
          {!user ? (
            <div className="p-4 mb-5 rounded-2xl bg-amber-500/10 border border-amber-400/25 text-center backdrop-blur-md">
              <p className="text-xs text-amber-200 font-medium mb-3">
                Sign in with Google to enable seamless exports to your Google Workspace account.
              </p>
              <GoogleSignInButton
                onClick={onSignIn}
                isLoading={isSigningIn}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between px-3.5 py-2 mb-4 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-xs">
              <span className="text-stone-300">
                Connected as: <strong className="text-white">{user.email}</strong>
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-medium">
                <Check className="w-3.5 h-3.5" /> Workspace Ready
              </span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1.5 pb-3 border-b border-white/10 mb-4 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'docs'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40 shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Google Docs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('slides')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'slides'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Presentation className="w-4 h-4 text-amber-400" />
              <span>Google Slides</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'tasks'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>Google Tasks</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('gmail')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'gmail'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40 shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Mail className="w-4 h-4 text-rose-400" />
              <span>Gmail Draft</span>
            </button>
          </div>

          {/* Feedback & Result Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 backdrop-blur-md">
              {errorMsg}
            </div>
          )}

          {successLink && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs flex items-center justify-between gap-2 backdrop-blur-md">
              <span className="text-emerald-200 font-medium">
                {successLink.text}
              </span>
              <a
                href={successLink.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-semibold text-emerald-300 underline shrink-0 hover:text-white"
              >
                <span>Open in Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* TAB 1: GOOGLE DOCS */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <div className="text-[11px] uppercase font-mono text-stone-500 mb-1">
                  Document Target
                </div>
                <div className="text-sm font-semibold">{documentTitle || 'Untitled Draft'}</div>
                <div className="text-xs text-stone-500 mt-1 line-clamp-3 font-serif">
                  {documentContent.slice(0, 200)}...
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!user || isExporting}
                  onClick={handleOpenDocsConfirm}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  <span>Export to Google Docs</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE SLIDES */}
          {activeTab === 'slides' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  Synthesize your writing into an executive presentation outline.
                </p>
                <button
                  type="button"
                  disabled={isGeneratingSlides}
                  onClick={handleGenerateSlides}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold transition"
                >
                  {isGeneratingSlides ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{slidesOutline.length > 0 ? 'Regenerate Outline' : 'Generate Outline'}</span>
                </button>
              </div>

              {slidesOutline.length > 0 ? (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {slidesOutline.map((slide, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs"
                    >
                      <div className="font-semibold text-stone-900 dark:text-white mb-1.5">
                        Slide {idx + 1}: {slide.title}
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-300">
                        {slide.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                      {slide.speakerNotes && (
                        <div className="mt-2 text-[11px] text-stone-400 italic">
                          Notes: {slide.speakerNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed rounded-xl border-stone-200 dark:border-stone-800 text-stone-400 text-xs">
                  Click &ldquo;Generate Outline&rdquo; to analyze your draft into presentation slides.
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!user || slidesOutline.length === 0 || isExporting}
                  onClick={handleOpenSlidesConfirm}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />}
                  <span>Export to Google Slides ({slidesOutline.length} Slides)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  Extract actionable follow-ups, to-dos, and research seeds.
                </p>
                <button
                  type="button"
                  disabled={isExtractingTasks}
                  onClick={handleExtractTasks}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition"
                >
                  {isExtractingTasks ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{extractedTasks.length > 0 ? 'Re-extract Tasks' : 'Extract Tasks'}</span>
                </button>
              </div>

              {extractedTasks.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {extractedTasks.map((t, idx) => (
                    <div
                      key={t.id || idx}
                      onClick={() => toggleTaskSelected(idx)}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        t.selected
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                          : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!t.selected}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-emerald-600"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-stone-900 dark:text-stone-100">
                          {t.title}
                        </div>
                        {t.notes && <div className="text-[11px] text-stone-500 mt-0.5">{t.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed rounded-xl border-stone-200 dark:border-stone-800 text-stone-400 text-xs">
                  Click &ldquo;Extract Tasks&rdquo; to identify next steps from your piece.
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!user || extractedTasks.filter((t) => t.selected).length === 0 || isExporting}
                  onClick={handleOpenTasksConfirm}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                  <span>
                    Sync {extractedTasks.filter((t) => t.selected).length} Item(s) to Google Tasks
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: GMAIL */}
          {activeTab === 'gmail' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Recipient (Optional)
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="e.g. editor@publication.com or team@company.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <div className="text-[10px] uppercase font-mono text-stone-400 mb-1">
                  Draft Body Preview
                </div>
                <div className="text-xs text-stone-600 dark:text-stone-300 line-clamp-4 font-serif">
                  {documentContent}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!user || isExporting}
                  onClick={handleOpenGmailConfirm}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  <span>Save Draft to Gmail</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.confirmAction}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        isLoading={isExporting}
      />
    </>
  );
};
