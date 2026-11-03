import { getAccessToken } from './firebaseAuth.ts';
import type { SlideItem, TaskItem } from '../types/writing.ts';

async function getAuthorizedHeaders(): Promise<HeadersInit> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google to use Google Workspace features.');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Creates a brand new Google Doc with the provided title and markdown/plain text content.
 */
export async function createGoogleDoc(title: string, content: string): Promise<{ documentId: string; url: string }> {
  const headers = await getAuthorizedHeaders();

  // 1. Create document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: title || 'Untitled Museflow Piece' }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Failed to create Google Doc');
  }

  const doc = await createRes.json();
  const documentId = doc.documentId;

  // 2. Batch update to insert content
  if (content && content.trim().length > 0) {
    // Strip markdown formatting symbols slightly for clean reading or preserve clean markdown text
    const textToInsert = content.replace(/\r\n/g, '\n');
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: textToInsert,
            },
          },
        ],
      }),
    });

    if (!updateRes.ok) {
      console.warn('Could not populate initial text in Google Doc:', await updateRes.text());
    }
  }

  return {
    documentId,
    url: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

/**
 * Creates a Google Slides presentation from structured slides outline.
 */
export async function createGoogleSlidesPresentation(
  title: string,
  slides: SlideItem[]
): Promise<{ presentationId: string; url: string }> {
  const headers = await getAuthorizedHeaders();

  // 1. Create presentation
  const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: title || 'Museflow Presentation' }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Failed to create Google Slides presentation');
  }

  const presentation = await createRes.json();
  const presentationId = presentation.presentationId;

  // 2. Add slides via batchUpdate
  if (slides && slides.length > 0) {
    const requests: any[] = [];

    slides.forEach((slide, index) => {
      const slideId = `slide_gen_${index}_${Date.now()}`;
      // Add a slide with TITLE_AND_BODY layout
      requests.push({
        createSlide: {
          objectId: slideId,
          insertionIndex: index + 1,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY',
          },
        },
      });
    });

    try {
      await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ requests }),
      });
    } catch (e) {
      console.warn('Initial slide generation warning:', e);
    }
  }

  return {
    presentationId,
    url: `https://docs.google.com/presentation/d/${presentationId}/edit`,
  };
}

/**
 * Creates tasks in the user's primary Google Tasks list.
 */
export async function createGoogleTasks(tasks: TaskItem[]): Promise<{ count: number; listTitle: string }> {
  const headers = await getAuthorizedHeaders();

  // 1. Fetch user's task lists
  const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers,
  });

  if (!listsRes.ok) {
    const errData = await listsRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Failed to load Google Task lists');
  }

  const listsData = await listsRes.json();
  const primaryList = listsData.items?.[0] || { id: '@default', title: 'My Tasks' };
  const listId = primaryList.id;

  // 2. Insert tasks
  let createdCount = 0;
  for (const task of tasks) {
    if (!task.title) continue;
    const taskRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: task.title,
        notes: task.notes || 'Created from Museflow Thought Partner',
      }),
    });
    if (taskRes.ok) {
      createdCount++;
    }
  }

  return {
    count: createdCount,
    listTitle: primaryList.title || 'My Tasks',
  };
}

/**
 * Creates a Gmail draft message ready for the user to review or send.
 */
export async function createGmailDraft(
  subject: string,
  bodyText: string,
  toEmail?: string
): Promise<{ draftId: string; url: string }> {
  const headers = await getAuthorizedHeaders();

  // Build standard RFC 2822 email payload
  const emailLines = [
    toEmail ? `To: ${toEmail}` : '',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject || 'Draft from Museflow')))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    bodyText,
  ]
    .filter((l) => l !== null)
    .join('\r\n');

  // Convert to URL-safe base64
  const rawBase64 = btoa(unescape(encodeURIComponent(emailLines)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const draftRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: {
        raw: rawBase64,
      },
    }),
  });

  if (!draftRes.ok) {
    const errData = await draftRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Failed to create Gmail draft');
  }

  const draftData = await draftRes.json();
  return {
    draftId: draftData.id,
    url: 'https://mail.google.com/mail/u/0/#drafts',
  };
}
