const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// ═══════════════════════════════════════════════════
// AI PIPELINE — Robust multi-provider with local fallback
// ═══════════════════════════════════════════════════

// Provider 1: Google Gemini (free tier, very reliable)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyDummyKeyReplace');

async function callGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Provider 2: xAI Grok (secondary)
const { OpenAI } = require('openai');
const xaiClient = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1',
});

async function callGrok(prompt) {
  const response = await xaiClient.chat.completions.create({
    model: 'grok-2',
    messages: [
      { role: 'system', content: 'You are a helpful educational AI assistant. Always respond with valid content.' },
      { role: 'user', content: prompt }
    ],
  });
  return response.choices[0].message.content;
}

// Local fallback — deterministic, always works
function localFallback(type, context) {
  if (type === 'summary') {
    const text = context || '';
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15).slice(0, 8);
    if (sentences.length === 0) return 'This document covers educational content. Please review the key sections for detailed understanding.';
    return 'KEY POINTS FROM THE DOCUMENT:\n\n' + sentences.map((s, i) => `${i + 1}. ${s.trim()}.`).join('\n');
  }
  if (type === 'quiz') {
    return JSON.stringify({
      summary: context ? context.substring(0, 500) + '...' : 'Document content summary.',
      quiz: [
        { question: 'What is the main topic discussed in this document?', options: ['The primary subject matter', 'An unrelated topic', 'A fictional narrative', 'None of the above'], answer: 'The primary subject matter' },
        { question: 'Which learning approach is most effective?', options: ['Passive reading only', 'Active recall and practice', 'Memorization without understanding', 'Skipping difficult sections'], answer: 'Active recall and practice' },
        { question: 'What should you do after reading study material?', options: ['Forget about it', 'Take a quiz to test understanding', 'Never review again', 'Skip to the next topic'], answer: 'Take a quiz to test understanding' }
      ],
      youtube_topics: ['Study techniques for students', 'How to learn effectively', 'Educational strategies']
    });
  }
  if (type === 'tutor') {
    return `Great question! Here's what I can tell you about "${context}":\n\nThis is an important concept in education. Here are the key points:\n\n1. **Understanding the basics** — Start by grasping the fundamental concepts before moving to advanced topics.\n2. **Practice regularly** — Consistent practice helps reinforce learning and builds mastery.\n3. **Connect ideas** — Try to relate new concepts to things you already know.\n\nI recommend searching for video tutorials and practice problems on this topic for deeper understanding.`;
  }
  return 'I am here to help you learn! Please provide more details about your question.';
}

// Master AI call function with triple fallback
async function callAI(prompt, type = 'general', context = '') {
  // Try Gemini first
  try {
    console.log('[AI] Trying Google Gemini...');
    const result = await callGemini(prompt);
    console.log('[AI] ✓ Gemini succeeded');
    return result;
  } catch (err) {
    console.warn('[AI] ✗ Gemini failed:', err.message);
  }

  // Try xAI Grok second
  try {
    console.log('[AI] Trying xAI Grok...');
    const result = await callGrok(prompt);
    console.log('[AI] ✓ Grok succeeded');
    return result;
  } catch (err) {
    console.warn('[AI] ✗ Grok failed:', err.message);
  }

  // Local fallback — always works
  console.log('[AI] Using local fallback engine');
  return localFallback(type, context);
}

// Helper: robustly extract JSON from AI response
function extractJSON(text) {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch (e) { /* continue */ }

  // Try to find JSON block in markdown
  const jsonBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonBlockMatch) {
    try { return JSON.parse(jsonBlockMatch[1].trim()); } catch (e) { /* continue */ }
  }

  // Try to find first { ... } or [ ... ] block
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]); } catch (e) { /* continue */ }
  }

  return null;
}

// ═══════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════

app.get('/api/health', (req, res) => {
  res.json({
    status: 'Platform Active',
    ai: 'Multi-provider: Gemini → Grok → Local Fallback',
    version: '2.0'
  });
});

// PDF Upload & Full Analysis (summary + quiz + youtube topics)
app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    console.log('[PDF] Processing file:', req.file.originalname, `(${(req.file.size / 1024).toFixed(1)} KB)`);
    const data = await pdfParse(req.file.buffer);
    const extractedText = data.text.substring(0, 4000); // limit for token safety

    if (!extractedText || extractedText.trim().length < 20) {
      return res.status(400).json({ error: 'Could not extract enough text from this PDF. It may be scanned or image-based.' });
    }

    console.log('[PDF] Extracted', extractedText.length, 'characters. Sending to AI...');

    const prompt = `You are an educational AI. Analyze this study material and return a JSON object with exactly these three fields:
1. "summary" - A clear, well-structured summary of the content (3-5 paragraphs)
2. "quiz" - An array of 5 quiz questions, each with: "question" (string), "options" (array of 4 strings), "answer" (string matching one of the options exactly)
3. "youtube_topics" - An array of 4-5 specific search terms someone could use on YouTube to learn more about the topics covered

Return ONLY the raw JSON object. No markdown, no code blocks, no extra text.

TEXT TO ANALYZE:
${extractedText}`;

    const aiResult = await callAI(prompt, 'quiz', extractedText);
    const parsed = extractJSON(aiResult);

    if (parsed && parsed.summary && parsed.quiz && parsed.youtube_topics) {
      // Validate quiz structure
      const validQuiz = parsed.quiz.filter(q =>
        q.question && Array.isArray(q.options) && q.options.length >= 2 && q.answer
      );
      parsed.quiz = validQuiz.length > 0 ? validQuiz : JSON.parse(localFallback('quiz', extractedText)).quiz;
      return res.json(parsed);
    }

    // If AI returned something but not valid JSON, use fallback
    console.warn('[PDF] AI returned invalid JSON, using structured fallback');
    const fallback = JSON.parse(localFallback('quiz', extractedText));
    // Try to use AI text as summary if it has some content
    if (aiResult && aiResult.length > 100) {
      fallback.summary = aiResult.substring(0, 2000);
    }
    return res.json(fallback);

  } catch (err) {
    console.error('[PDF] Processing Error:', err.message);
    return res.status(500).json({
      error: 'Failed to process the PDF. Please try a different file.',
      details: err.message
    });
  }
});

// AI Tutor Chat
app.post('/api/tutor', async (req, res) => {
  const { question } = req.body;
  if (!question || question.trim().length === 0) {
    return res.status(400).json({ error: 'Please provide a question' });
  }

  try {
    const prompt = `You are SmartLearn AI Tutor — an extremely knowledgeable, patient, and encouraging teacher. A student has asked:

"${question}"

Provide a clear, structured, and helpful response. Use bullet points and examples where appropriate. Keep the tone friendly and educational. If the question is vague, provide a comprehensive overview of the topic.`;

    const reply = await callAI(prompt, 'tutor', question);
    res.json({ reply });
  } catch (err) {
    console.error('[Tutor] Error:', err.message);
    res.json({ reply: localFallback('tutor', question) });
  }
});

// Generate Quiz from Topic (no PDF needed)
app.post('/api/generate-quiz', async (req, res) => {
  const { topic, difficulty = 'medium' } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Please provide a topic' });
  }

  try {
    const prompt = `Generate a ${difficulty} difficulty quiz about "${topic}". Return ONLY a raw JSON object (no markdown, no code blocks) with this exact structure:
{
  "title": "Quiz title",
  "questions": [
    {"question": "Question text?", "options": ["A", "B", "C", "D"], "answer": "The correct option exactly as written in options"}
  ]
}
Generate exactly 5 questions. Make them educational and varied in difficulty.`;

    const aiResult = await callAI(prompt, 'quiz', topic);
    const parsed = extractJSON(aiResult);

    if (parsed && parsed.questions) {
      return res.json(parsed);
    }

    // Fallback quiz
    res.json({
      title: `Quiz: ${topic}`,
      questions: [
        { question: `What is the fundamental concept behind ${topic}?`, options: ['Core principles and theory', 'Random guessing', 'Unrelated field', 'None of the above'], answer: 'Core principles and theory' },
        { question: `Why is ${topic} important to study?`, options: ['It has no relevance', 'It builds critical thinking skills', 'It is purely theoretical', 'Only experts need to know it'], answer: 'It builds critical thinking skills' },
        { question: 'What is the best approach to learning new concepts?', options: ['Skip practice', 'Active recall and spaced repetition', 'Only read once', 'Ignore difficult parts'], answer: 'Active recall and spaced repetition' }
      ]
    });
  } catch (err) {
    console.error('[Quiz Gen] Error:', err.message);
    res.status(500).json({ error: 'Could not generate quiz' });
  }
});

// Get YouTube recommendations for a topic
app.post('/api/youtube-topics', async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Please provide a topic' });
  }

  try {
    const prompt = `For the educational topic "${topic}", suggest 6 specific YouTube search queries that would help a student find the best educational videos. Return ONLY a JSON array of strings, no other text. Example: ["query 1", "query 2", ...]`;

    const aiResult = await callAI(prompt, 'general', topic);
    const parsed = extractJSON(aiResult);

    if (Array.isArray(parsed)) {
      return res.json({ topics: parsed });
    }

    // Fallback
    res.json({
      topics: [
        `${topic} explained simply`,
        `${topic} tutorial for beginners`,
        `${topic} crash course`,
        `${topic} examples and problems`,
        `Learn ${topic} step by step`,
        `${topic} study guide`
      ]
    });
  } catch (err) {
    console.error('[YouTube] Error:', err.message);
    res.json({
      topics: [
        `${topic} tutorial`,
        `${topic} explained`,
        `${topic} for beginners`,
        `Learn ${topic}`
      ]
    });
  }
});

// Analyze student weaknesses
app.post('/api/analyze-weakness', async (req, res) => {
  const { studentData } = req.body;

  try {
    const prompt = `Analyze this student performance data and identify 2-3 weak areas. Provide specific actionable recommendations for improvement. Be encouraging but honest.\n\nStudent Data: ${JSON.stringify(studentData)}`;
    const analysis = await callAI(prompt, 'general', JSON.stringify(studentData));
    res.json({ analysis });
  } catch (err) {
    console.error('[Analysis] Error:', err.message);
    res.json({ analysis: 'Based on your performance data, I recommend focusing on consistent daily practice and reviewing topics where your scores are below 70%. Consider using flashcards and practice problems to strengthen weak areas.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 SmartLearn AI Backend v2.0 running on port ${PORT}`);
  console.log(`   AI Pipeline: Gemini → Grok → Local Fallback`);
  console.log(`   Endpoints: /api/health, /api/upload-pdf, /api/tutor, /api/generate-quiz, /api/youtube-topics\n`);
});
