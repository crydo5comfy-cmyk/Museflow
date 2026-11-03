import type { DocSnapshot, WritingDoc } from '../types/writing.ts';

const STORAGE_PREFIX = 'museflow_versions_';

function getStorageKey(docId: string): string {
  return `${STORAGE_PREFIX}${docId || 'default'}`;
}

function calculateWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

export function getDocSnapshots(docId: string): DocSnapshot[] {
  try {
    const raw = localStorage.getItem(getStorageKey(docId));
    if (!raw) return [];
    const list: DocSnapshot[] = JSON.parse(raw);
    return Array.isArray(list) ? list.sort((a, b) => b.timestamp - a.timestamp) : [];
  } catch (err) {
    console.warn('Failed to load version snapshots:', err);
    return [];
  }
}

export function saveDocSnapshot(
  doc: WritingDoc,
  label?: string,
  isAutoSnapshot: boolean = false
): DocSnapshot {
  const existing = getDocSnapshots(doc.id);
  const now = Date.now();

  // Deduplicate: if the most recent snapshot has identical content, don't create a redundant duplicate unless manually requested with a distinct label
  if (isAutoSnapshot && existing.length > 0 && existing[0].content === doc.content) {
    return existing[0];
  }

  const snapshot: DocSnapshot = {
    id: `snap_${now}_${Math.random().toString(36).slice(2, 7)}`,
    docId: doc.id,
    title: doc.title,
    content: doc.content,
    timestamp: now,
    label: label || (isAutoSnapshot ? 'Auto-checkpoint' : `Manual Snapshot #${existing.length + 1}`),
    wordCount: calculateWords(doc.content),
    isAutoSnapshot,
  };

  // Keep up to 60 snapshots per document
  const updated = [snapshot, ...existing].slice(0, 60);

  try {
    localStorage.setItem(getStorageKey(doc.id), JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save snapshot to localStorage:', err);
  }

  return snapshot;
}

export function deleteDocSnapshot(docId: string, snapshotId: string): DocSnapshot[] {
  const existing = getDocSnapshots(docId);
  const updated = existing.filter((s) => s.id !== snapshotId);
  try {
    localStorage.setItem(getStorageKey(docId), JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete snapshot:', err);
  }
  return updated;
}

export function clearDocSnapshots(docId: string): void {
  try {
    localStorage.removeItem(getStorageKey(docId));
  } catch (err) {
    console.warn('Failed to clear snapshots:', err);
  }
}
