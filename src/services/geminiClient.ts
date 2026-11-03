import type {
  AttachedFile,
  IterationResult,
  IterationScope,
  PresentationOutline,
  ProactiveSuggestion,
  TaskItem,
} from '../types/writing.ts';

export async function generateInitialDraft(params: {
  prompt: string;
  files: AttachedFile[];
  format?: string;
  tone?: string;
  targetLength?: string;
  targetAudience?: string;
  model?: string;
}): Promise<{ content: string; modelUsed: string }> {
  const response = await fetch('/api/gemini/generate-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with ${response.status}`);
  }

  return response.json();
}

export async function iterateInline(params: {
  fullText: string;
  selectedText: string;
  feedback: string;
  scope: IterationScope;
  model?: string;
}): Promise<IterationResult> {
  const response = await fetch('/api/gemini/iterate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with ${response.status}`);
  }

  const data = await response.json();
  return {
    ...data,
    originalText: params.selectedText,
  };
}

export async function fetchProactiveSuggestions(fullText: string): Promise<ProactiveSuggestion[]> {
  const response = await fetch('/api/gemini/proactive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullText }),
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return (data.suggestions || []).map((s: any) => ({
    ...s,
    createdAt: Date.now(),
  }));
}

export async function getSlideOutline(draftText: string, title?: string): Promise<PresentationOutline> {
  const response = await fetch('/api/gemini/slides-outline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ draftText, title }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to outline slides');
  }

  return response.json();
}

export async function extractTasks(draftText: string): Promise<TaskItem[]> {
  const response = await fetch('/api/gemini/extract-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ draftText }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to extract tasks');
  }

  const data = await response.json();
  return (data.tasks || []).map((t: any, idx: number) => ({
    ...t,
    id: `task-${idx}-${Date.now()}`,
    selected: true,
  }));
}
