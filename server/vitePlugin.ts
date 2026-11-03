import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import {
  generateDraftService,
  iterateService,
  proactiveAnalysisService,
  generateSlideOutlineService,
  extractActionItemsService,
} from './geminiService.ts';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Protect against overly massive payloads (>15MB)
      if (body.length > 15 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function geminiApiPlugin(): Plugin {
  return {
    name: 'vite-gemini-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        if (!url || (!url.startsWith('/api/gemini/') && url !== '/api/health')) {
          return next();
        }

        try {
          if (url === '/api/health') {
            return sendJson(res, 200, { status: 'ok', time: new Date().toISOString() });
          }

          if (req.method !== 'POST') {
            return sendJson(res, 405, { error: 'Method not allowed' });
          }

          const rawBody = await readBody(req);
          const body = rawBody ? JSON.parse(rawBody) : {};

          if (url === '/api/gemini/generate-draft') {
            const result = await generateDraftService(body);
            return sendJson(res, 200, result);
          }

          if (url === '/api/gemini/iterate') {
            const result = await iterateService(body);
            return sendJson(res, 200, result);
          }

          if (url === '/api/gemini/proactive') {
            const result = await proactiveAnalysisService(body.fullText || '');
            return sendJson(res, 200, { suggestions: result });
          }

          if (url === '/api/gemini/slides-outline') {
            const result = await generateSlideOutlineService(body.draftText || '', body.title);
            return sendJson(res, 200, result);
          }

          if (url === '/api/gemini/extract-tasks') {
            const result = await extractActionItemsService(body.draftText || '');
            return sendJson(res, 200, { tasks: result });
          }

          return sendJson(res, 404, { error: 'Not found' });
        } catch (error: any) {
          console.error(`Error handling ${url}:`, error);
          return sendJson(res, 500, {
            error: error?.message || 'Internal server error while calling Gemini API',
          });
        }
      });
    },
  };
}
