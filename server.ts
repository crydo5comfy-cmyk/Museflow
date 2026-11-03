import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  generateDraftService,
  iterateService,
  proactiveAnalysisService,
  generateSlideOutlineService,
  extractActionItemsService,
} from './server/geminiService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Gemini endpoints
app.post('/api/gemini/generate-draft', async (req, res) => {
  try {
    const result = await generateDraftService(req.body);
    res.json(result);
  } catch (err: any) {
    console.error('generate-draft error:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate draft' });
  }
});

app.post('/api/gemini/iterate', async (req, res) => {
  try {
    const result = await iterateService(req.body);
    res.json(result);
  } catch (err: any) {
    console.error('iterate error:', err);
    res.status(500).json({ error: err?.message || 'Failed to iterate' });
  }
});

app.post('/api/gemini/proactive', async (req, res) => {
  try {
    const result = await proactiveAnalysisService(req.body.fullText || '');
    res.json({ suggestions: result });
  } catch (err: any) {
    console.error('proactive error:', err);
    res.status(500).json({ error: err?.message || 'Failed proactive analysis' });
  }
});

app.post('/api/gemini/slides-outline', async (req, res) => {
  try {
    const result = await generateSlideOutlineService(req.body.draftText || '', req.body.title);
    res.json(result);
  } catch (err: any) {
    console.error('slides-outline error:', err);
    res.status(500).json({ error: err?.message || 'Failed slide outline' });
  }
});

app.post('/api/gemini/extract-tasks', async (req, res) => {
  try {
    const result = await extractActionItemsService(req.body.draftText || '');
    res.json({ tasks: result });
  } catch (err: any) {
    console.error('extract-tasks error:', err);
    res.status(500).json({ error: err?.message || 'Failed task extraction' });
  }
});

// Serve static frontend in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Museflow server running on port ${PORT}`);
});
