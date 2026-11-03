export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // text or base64 data url
  isBase64?: boolean;
}

export interface WritingDoc {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  tone?: string;
  format?: string;
  synopsis?: string;
}

export interface ProactiveSuggestion {
  id: string;
  type: 'clarity' | 'impact' | 'argument' | 'pacing' | 'grammar';
  originalSnippet: string;
  suggestedSnippet: string;
  explanation: string;
  scope: 'sentence' | 'paragraph';
  targetIndex?: number;
  createdAt: number;
}

export type IterationScope = 'sentence' | 'paragraph' | 'article';

export interface IterationResult {
  scope: IterationScope;
  originalText: string;
  revisedText: string;
  explanation: string;
  diffSummary: string;
  modelUsed?: string;
}

export interface SlideItem {
  title: string;
  bullets: string[];
  speakerNotes?: string;
}

export interface PresentationOutline {
  presentationTitle: string;
  subtitle?: string;
  slides: SlideItem[];
}

export interface TaskItem {
  id?: string;
  title: string;
  notes?: string;
  priority?: string;
  selected?: boolean;
}
