import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

// Initialize Gemini SDK with telemetry header per skill rules
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface AttachedFilePayload {
  name: string;
  type: string;
  content: string; // Base64 or plain text
  isBase64?: boolean;
}

export interface GenerateDraftRequest {
  prompt: string;
  files?: AttachedFilePayload[];
  format?: string;
  tone?: string;
  targetLength?: string;
  targetAudience?: string;
  model?: string;
}

export interface IterateRequest {
  fullText: string;
  selectedText: string;
  feedback: string;
  scope: 'sentence' | 'paragraph' | 'article';
  model?: string;
}

export interface ProactiveSuggestion {
  id: string;
  type: 'clarity' | 'impact' | 'argument' | 'pacing' | 'grammar';
  originalSnippet: string;
  suggestedSnippet: string;
  explanation: string;
  scope: 'sentence' | 'paragraph';
  targetIndex?: number;
}

/**
 * Generate an initial piece of writing based on prompt and attached research files.
 */
export async function generateDraftService(params: GenerateDraftRequest) {
  const model = params.model === 'gemini-4-argon' ? 'gemini-4-argon' : 'gemini-3.8-flash';

  const parts: any[] = [];

  // Add attached files if any
  if (params.files && params.files.length > 0) {
    for (const file of params.files) {
      if (file.isBase64 && file.type.startsWith('image/')) {
        parts.push({
          inlineData: {
            mimeType: file.type,
            data: file.content.replace(/^data:[^;]+;base64,/, ''),
          },
        });
        parts.push({ text: `[Attachment: ${file.name} (Image reference)]` });
      } else {
        parts.push({
          text: `[Attached Document: "${file.name}"]\n${file.content}\n--- End of Document ---`,
        });
      }
    }
  }

  const systemInstruction = `You are a world-class thought partner and master writer.
You produce compelling, authentic, distraction-free prose that avoids cliches, hollow corporate jargon, and generic AI filler.
Structure the piece cleanly with natural flow, vivid examples, and strong thematic cohesion.
Format with clean Markdown (Title as #, sections as ##, thoughtful paragraph breaks).
Also provide a 1-sentence synopsis and 3 suggested exploration questions for next iterations.`;

  const promptText = `Writing Request:
Primary Goal: ${params.prompt}
Format: ${params.format || 'Article'}
Tone: ${params.tone || 'Thoughtful & engaging'}
Target Length: ${params.targetLength || 'Medium (~600-800 words)'}
Target Audience: ${params.targetAudience || 'General thoughtful readers'}

Attached Context: ${params.files && params.files.length > 0 ? `${params.files.length} reference documents attached above.` : 'None.'}

Please write the draft now. Begin with a single # Main Title, followed by the content. At the very end, add a divider '---' followed by:
**Thought Partner Notes:**
- Synopsis: [1 sentence overview]
- Key Angle: [the primary hook/angle chosen]
- Future Seeds: [2-3 ideas to expand or test in subsequent revisions]`;

  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction,
    },
  });

  return {
    content: response.text || '',
    modelUsed: model,
  };
}

/**
 * Inline iteration: Rewrite a sentence, paragraph, or weave changes into the whole article
 * based on user's inline feedback notes.
 */
export async function iterateService(params: IterateRequest) {
  const model = params.model === 'gemini-4-argon' ? 'gemini-4-argon' : 'gemini-3.8-flash';

  const systemInstruction = `You are an elite co-author and editor collaborating directly inline.
The author is providing targeted feedback on a specific part of their draft.
Your goal is to weave the feedback into the text naturally, seamlessly matching or elevating the author's voice without losing context.
Never add conversational preamble like "Sure, here is your rewrite:".
Always return structured JSON containing:
- revisedText: The new text replacement for the requested scope.
- explanation: A concise, polite explanation of what changed and why.
- diffSummary: A quick 3-8 word highlight of the core transformation.`;

  let prompt = '';
  if (params.scope === 'sentence') {
    prompt = `FULL DOCUMENT CONTEXT:
"""
${params.fullText}
"""

TARGET SENTENCE TO REWRITE:
"${params.selectedText}"

AUTHOR'S INLINE FEEDBACK:
"${params.feedback}"

TASK:
Rewrite ONLY the target sentence to address the author's feedback while fitting smoothly into its immediate surrounding sentences.`;
  } else if (params.scope === 'paragraph') {
    prompt = `FULL DOCUMENT CONTEXT:
"""
${params.fullText}
"""

TARGET PARAGRAPH TO REWRITE:
"""
${params.selectedText}
"""

AUTHOR'S INLINE FEEDBACK:
"${params.feedback}"

TASK:
Rewrite the ENTIRE paragraph to weave in the author's feedback organically. Maintain narrative continuity with the surrounding document.`;
  } else {
    // Article scope
    prompt = `FULL DOCUMENT TO WEAVE FEEDBACK INTO:
"""
${params.fullText}
"""

SPECIFIC SECTION OF CONCERN (FOCUS):
"""
${params.selectedText}
"""

AUTHOR'S STRATEGIC FEEDBACK:
"${params.feedback}"

TASK:
Weave this feedback across the ENTIRE article or post. Ensure the tone, arguments, and transitions harmonize smoothly throughout the whole piece. Return the complete updated document in 'revisedText'.`;
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          revisedText: {
            type: Type.STRING,
            description: 'The updated replacement text for the requested scope',
          },
          explanation: {
            type: Type.STRING,
            description: 'Brief explanation of how the feedback was woven in',
          },
          diffSummary: {
            type: Type.STRING,
            description: 'Short phrase summarizing key changes',
          },
        },
        required: ['revisedText', 'explanation', 'diffSummary'],
      },
    },
  });

  const parsed = JSON.parse(response.text || '{}');
  return {
    ...parsed,
    scope: params.scope,
    modelUsed: model,
  };
}

/**
 * Proactive Thought Partner analysis:
 * Fast, ambient suggestions to sharpen prose, break monotony, or highlight thesis gaps.
 * Uses gemini-3.1-flash-lite for minimal latency.
 */
export async function proactiveAnalysisService(fullText: string): Promise<ProactiveSuggestion[]> {
  if (!fullText || fullText.trim().length < 80) {
    return [];
  }

  const systemInstruction = `You are a discreet, high-taste co-writer and thought partner.
You look at the text and identify 1 to 3 constructive, high-leverage in-line suggestions.
Do not nitpick minor stylistic quirks unless they truly impair clarity or punch.
Look for:
1. 'clarity': Wordy or bloated sentences that can be sharpened.
2. 'impact': Weak closings or passive phrasing that can be made unforgettable.
3. 'argument': Statements begging for a concrete anchor or counterpoint.
4. 'pacing': Overly uniform sentence rhythms or sluggish transitions.

Return a JSON array of suggestions. originalSnippet MUST be an EXACT verbatim substring from the document.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `DOCUMENT:
"""
${fullText}
"""

Find up to 3 high-impact in-line suggestions. Return JSON array.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: {
                type: Type.STRING,
                description: 'clarity, impact, argument, or pacing',
              },
              originalSnippet: {
                type: Type.STRING,
                description: 'Verbatim text inside the document to replace',
              },
              suggestedSnippet: {
                type: Type.STRING,
                description: 'The proposed improved replacement text',
              },
              explanation: {
                type: Type.STRING,
                description: 'Reason for the suggestion in 1 concise sentence',
              },
              scope: {
                type: Type.STRING,
                description: 'sentence or paragraph',
              },
            },
            required: ['type', 'originalSnippet', 'suggestedSnippet', 'explanation', 'scope'],
          },
        },
      },
    });

    const list = JSON.parse(response.text || '[]');
    // Filter to ensure originalSnippet is actually in the text
    return list
      .filter((item: any) => fullText.includes(item.originalSnippet))
      .map((item: any, idx: number) => ({
        ...item,
        id: item.id || `sugg-${Date.now()}-${idx}`,
      }));
  } catch (err) {
    console.error('Proactive analysis error:', err);
    return [];
  }
}

/**
 * Generate Slide Outline for Google Slides export
 */
export async function generateSlideOutlineService(draftText: string, title?: string) {
  const systemInstruction = `You are an expert keynote presentation designer.
Analyze the provided writing and synthesize it into a punchy, executive-ready presentation outline with 4-7 slides.
Each slide must have:
- title: compelling, concise slide headline
- bullets: 2 to 4 high-impact takeaway bullet points
- speakerNotes: 1-2 conversational sentences for the speaker.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: `DOCUMENT TITLE: ${title || 'Draft Document'}
CONTENT:
"""
${draftText}
"""

Synthesize into presentation slides.`,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          presentationTitle: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          slides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                bullets: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                speakerNotes: { type: Type.STRING },
              },
              required: ['title', 'bullets'],
            },
          },
        },
        required: ['presentationTitle', 'slides'],
      },
    },
  });

  return JSON.parse(response.text || '{}');
}

/**
 * Extract Action Items for Google Tasks
 */
export async function extractActionItemsService(draftText: string) {
  const systemInstruction = `Extract actionable next steps, follow-ups, research tasks, and to-dos implied by the provided draft or notes.
Return 3 to 7 concrete tasks with titles and brief notes.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: `DOCUMENT:
"""
${draftText}
"""

Extract actionable tasks.`,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Imperative task title' },
            notes: { type: Type.STRING, description: 'Context or rationale' },
            priority: { type: Type.STRING, description: 'high, medium, or low' },
          },
          required: ['title'],
        },
      },
    },
  });

  return JSON.parse(response.text || '[]');
}
