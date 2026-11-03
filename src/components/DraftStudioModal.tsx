import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Paperclip,
  X,
  FileText,
  FileImage,
  UploadCloud,
  Loader2,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import type { AttachedFile } from '../types/writing.ts';

interface DraftStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: {
    prompt: string;
    files: AttachedFile[];
    format: string;
    tone: string;
    targetLength: string;
    targetAudience: string;
    model: string;
  }) => Promise<void>;
  isLoading: boolean;
}

const FORMAT_PRESETS = [
  'Deep-Dive Essay',
  'Strategic Memo',
  'Product Manifesto',
  'Op-Ed / Thought Piece',
  'Executive Summary',
  'Story & Creative Prose',
  'Pitch & Cold Outreach',
];

const TONE_PRESETS = [
  'Provocative & Insightful',
  'Pragmatic & Crisp',
  'Poetic & Evocative',
  'Authoritative Executive',
  'Conversational & Warm',
  'Analytical & Grounded',
];

const LENGTH_PRESETS = [
  { label: 'Snackable (~300 words)', val: 'Brief (~300 words)' },
  { label: 'Standard (~700 words)', val: 'Medium (~700 words)' },
  { label: 'Comprehensive (~1,400 words)', val: 'Deep (~1400 words)' },
];

export const DraftStudioModal: React.FC<DraftStudioModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isLoading,
}) => {
  const [prompt, setPrompt] = useState('');
  const [format, setFormat] = useState(FORMAT_PRESETS[0]);
  const [tone, setTone] = useState(TONE_PRESETS[0]);
  const [targetLength, setTargetLength] = useState(LENGTH_PRESETS[1].val);
  const [targetAudience, setTargetAudience] = useState('Founders, creators, and thoughtful thinkers');
  const [model, setModel] = useState('gemini-3.8-flash');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    await processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          setAttachedFiles((prev) => [
            ...prev,
            {
              id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: file.name,
              type: file.type,
              size: file.size,
              content: (evt.target?.result as string) || '',
              isBase64: true,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (evt) => {
          setAttachedFiles((prev) => [
            ...prev,
            {
              id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: file.name,
              type: file.type || 'text/plain',
              size: file.size,
              content: (evt.target?.result as string) || '',
              isBase64: false,
            },
          ]);
        };
        reader.readAsText(file);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onGenerate({
      prompt: prompt.trim(),
      files: attachedFiles,
      format,
      tone,
      targetLength,
      targetAudience,
      model,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                Co-Author a New Piece
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Provide your core premise, notes, and attachments — Gemini drafts with depth.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prompt */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
              What do you want to explore or write about?
            </label>
            <textarea
              rows={4}
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              placeholder="e.g. Why the most interesting ideas happen at the messy boundary of two unrelated disciplines, referencing recent breakthroughs in AI and biology..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm placeholder:text-stone-400 leading-relaxed font-serif"
            />
          </div>

          {/* File Attachments Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Attach Notes, PDFs, Images or Research
              </label>
              <span className="text-[11px] text-stone-400">
                {attachedFiles.length} file{attachedFiles.length === 1 ? '' : 's'} attached
              </span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-stone-300 dark:border-stone-700 hover:border-amber-400/80 bg-stone-50/50 dark:bg-stone-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".txt,.md,.pdf,.csv,.json,.doc,.docx,image/*"
              />
              <UploadCloud className="w-6 h-6 mx-auto mb-1.5 text-stone-400" />
              <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
                Drop files here, or <span className="text-amber-600 underline">browse</span>
              </p>
              <p className="text-[10px] text-stone-400 mt-0.5">
                Supports research docs, outlines, interview transcripts, and reference imagery
              </p>
            </div>

            {/* Attached file chips */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                  >
                    {file.isBase64 ? (
                      <FileImage className="w-3.5 h-3.5 text-indigo-500" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    <span className="max-w-[140px] truncate text-stone-700 dark:text-stone-300">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-white p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Style & Voice Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-xs focus:ring-1 focus:ring-amber-500"
              >
                {FORMAT_PRESETS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                Tone & Voice
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-xs focus:ring-1 focus:ring-amber-500"
              >
                {TONE_PRESETS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                Target Length
              </label>
              <select
                value={targetLength}
                onChange={(e) => setTargetLength(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-xs focus:ring-1 focus:ring-amber-500"
              >
                {LENGTH_PRESETS.map((len) => (
                  <option key={len.val} value={len.val}>
                    {len.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                AI Intelligence Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-xs focus:ring-1 focus:ring-amber-500 font-mono"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Fast & Highly Capable)</option>
                <option value="gemini-4-argon">gemini-4-argon (Deepest Reasoning & Synthesis)</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Drafting piece...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Initial Draft</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
