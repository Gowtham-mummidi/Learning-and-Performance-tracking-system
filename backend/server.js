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

// Local fallback — deterministic, always works -> now dynamic with open source alternatives in mind
function localFallback(type, context) {
  if (type === 'summary') {
    const text = context || '';
    const cleaned = text.replace(/[\r\n]+/g, ' ');
    const sentences = cleaned.split(/[^.!?]+[.!?]+/g) || [];
    // Or simpler matcher for sentences:
    const regex = /[^\.!\?]+[\.!\?]+/g;
    const matched = cleaned.match(regex) || [cleaned];
    const valid = matched.filter(s => s.trim().length > 30);
    
    if (valid.length === 0) {
      return 'DOCUMENT SUMMARY:\n\n' + cleaned.substring(0, 800) + '...';
    }
    
    return 'KEY HIGHLIGHTS FROM DOCUMENT:\n\n' + valid.slice(0, 8).map((s, i) => `${i+1}. ${s.trim()}`).join('\n');
  }
  if (type === 'quiz') {
    let mappedQuestions = [];
    const isDoc = context && context.length > 300;
    
    if (isDoc) {
      // Build realistic questions by reading the PDF (context)
      const cleaned = context.replace(/[\r\n]+/g, ' ');
      const sentences = (cleaned.match(/[^\.!\?]+[\.!\?]+/g) || [cleaned])
        .filter(s => s.trim().length > 40 && s.trim().length < 150);
      
      const shuffledSentences = sentences.sort(() => 0.5 - Math.random()).slice(0, 5);
      
      if (shuffledSentences.length < 3) {
        // Fallback to generic if we couldn't parse enough document text
        const fallbackOpts = ['True', 'False', 'Not Mentioned', 'All of the above'];
        mappedQuestions = [
          { question: `Does the document cover core principles thoroughly?`, options: fallbackOpts, answer: 'True' },
          { question: `What is the best way to master this material?`, options: ['Active review', 'Skipping chapters', 'None of the above', 'Guessing'], answer: 'Active review' },
          { question: `The primary focus of this text is advanced concepts.`, options: fallbackOpts, answer: 'False' },
          { question: `Which tool is primarily discussed?`, options: ['Analytical thinking', 'Mechanical tools', 'None', 'TBD'], answer: 'Analytical thinking' },
          { question: `Is practice emphasized in learning this?`, options: fallbackOpts, answer: 'True' }
        ];
      } else {
        mappedQuestions = shuffledSentences.map(sentence => {
          const words = sentence.trim().split(' ').filter(w => w.length > 4);
          if (words.length === 0) {
              return { question: 'Is this concept detailed in the text?', options: ['Yes', 'No', 'Maybe', 'N/A'], answer: 'Yes' };
          }
          const targetWord = words[Math.floor(Math.random() * words.length)];
          const blanked = sentence.replace(targetWord, '______');
          return {
            question: `Fill in the blank from the text: "${blanked}"`,
            options: [
              targetWord, 
              targetWord.split('').reverse().join(''), 
              'Irrelevant', 
              'None of the above'
            ].sort(() => 0.5 - Math.random()),
            answer: targetWord
          };
        });
        
        while (mappedQuestions.length < 5) {
          mappedQuestions.push({ question: 'Does the document emphasize core fundamentals?', options: ['Yes', 'No', 'Uncertain', 'Maybe'], answer: 'Yes' });
        }
      }
    } else {
      // Short topic input -> generic quiz
      const questionsBank = [
        { q: `What is the fundamental concept behind this topic?`, a: 'Core principles and theory', opts: ['Core principles and theory', 'Random guessing', 'Unrelated field', 'None of the above'] },
        { q: `Why is this topic important to study?`, a: 'It builds critical thinking skills', opts: ['It has no relevance', 'It builds critical thinking skills', 'It is purely theoretical', 'Only experts need to know it'] },
        { q: `What is the best approach to learning new concepts?`, a: 'Active recall and spaced repetition', opts: ['Skip practice', 'Active recall and spaced repetition', 'Only read once', 'Ignore difficult parts'] },
        { q: `How can you apply this knowledge practically?`, a: 'By solving real-world problems', opts: ['By ignoring it entirely', 'By solving real-world problems', 'It has no practical use', 'Only in theoretical debates'] },
        { q: `Which study tool is most effective for this?`, a: 'Practice questions and flashcards', opts: ['Watching TV', 'Practice questions and flashcards', 'Staring at the book', 'Sleeping'] },
        { q: `What is the main objective of studying this material?`, a: 'To deeply understand the core subject', opts: ['To pass time', 'To deeply understand the core subject', 'To forget it later', 'None of the above'] },
        { q: `When should you review this topic?`, a: 'Consistently over time', opts: ['Consistently over time', 'Only the night before the exam', 'Never', 'Once every five years'] },
        { q: `What makes this subject unique?`, a: 'Its specific methodology and principles', opts: ['Nothing', 'Its specific methodology and principles', 'It is confusing', 'It requires no effort'] }
      ];
      const shuffled = questionsBank.sort(() => 0.5 - Math.random()).slice(0, 5);
      const topicName = (context && context.length < 50) ? context : "this topic";
      mappedQuestions = shuffled.map(x => ({
        question: x.q.replace(/this topic/gi, topicName),
        options: x.opts,
        answer: x.a
      }));
    }

    return JSON.stringify({
      title: `Quiz: ${topicName}`,
      summary: localFallback('summary', context),
      quiz: mappedQuestions,
      questions: mappedQuestions,
      youtube_topics: [`${topicName} for beginners`, `Learn ${topicName}`, `${topicName} explained`, `${topicName} core concepts`]
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

// Generate Quiz from Topic & Scrape Web (no PDF needed)
app.post('/api/generate-quiz', async (req, res) => {
  const { topic, difficulty = 'medium' } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Please provide a topic' });
  }

  try {
    const axios = require('axios');
    const SERP_API_KEY = process.env.SERP_API_KEY || 'b4936c3977ddece4064f6f2e6e5855e9efa57d6655ad228eebe6dcf0404170a7';
    
    const qsUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(topic + " tutorial questions")}&api_key=${SERP_API_KEY}`;
    const qsPromise = axios.get(qsUrl).catch(() => null);

    const pdfUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(topic + " filetype:pdf")}&api_key=${SERP_API_KEY}`;
    const pdfPromise = axios.get(pdfUrl).catch(() => null);

    const ytUrl = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(topic + " tutorial")}&api_key=${SERP_API_KEY}`;
    const ytPromise = axios.get(ytUrl).catch(() => null);

    const [qsRes, pdfRes, ytRes] = await Promise.all([qsPromise, pdfPromise, ytPromise]);

    const pdfs = pdfRes?.data?.organic_results?.filter(r => r.link.endsWith('.pdf')).slice(0, 6).map(r => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet
    })) || [];

    const importantQA = qsRes?.data?.related_questions?.slice(0, 6).map(q => ({
      question: q.question,
      snippet: q.snippet
    })) || [];

    const relatedTopics = qsRes?.data?.related_searches?.slice(0, 6).map(r => r.query) || 
                          [ `${topic} basics`, `${topic} advanced examples`, `Learn ${topic}` ];

    const videos = ytRes?.data?.video_results?.slice(0, 6).map(v => ({
      title: v.title,
      link: v.link,
      thumbnail: v.thumbnail?.static || v.thumbnail?.url
    })) || [];

    const fallbackQuiz = JSON.parse(localFallback('quiz', topic));
    
    // If we have scraped questions (PAA), convert them into the main quiz format
    let finalQuestions = fallbackQuiz.quiz || fallbackQuiz.questions;
    
    if (importantQA.length > 0) {
      finalQuestions = importantQA.map(qa => ({
        question: qa.question,
        options: [
          qa.snippet ? (qa.snippet.substring(0, 100) + '...') : 'Check related resources',
          'Incorrect information',
          'Not applicable to this topic',
          'None of the above'
        ].sort(() => 0.5 - Math.random()),
        answer: qa.snippet ? (qa.snippet.substring(0, 100) + '...') : 'Check related resources'
      })).slice(0, 5);
    }

    res.json({
      title: `Web Scraped Quiz: ${topic}`,
      questions: finalQuestions,
      importantQA,
      relatedTopics,
      pdfs,
      videos
    });

  } catch (err) {
    console.error('[Quiz Gen] Error:', err.message);
    const fallback = JSON.parse(localFallback('quiz', topic));
    res.json({ title: fallback.title, questions: fallback.quiz, importantQA: [], relatedTopics: [], pdfs: [], videos: [] });
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

// Topic Search Endpoint Using SerpAPI
app.post('/api/topic-search', async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Please provide a topic' });
  }

  try {
    const axios = require('axios');
    const SERP_API_KEY = process.env.SERP_API_KEY || 'b4936c3977ddece4064f6f2e6e5855e9efa57d6655ad228eebe6dcf0404170a7';
    
    // 1. YouTube Videos Search
    const ytUrl = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(topic + " tutorial")}&api_key=${SERP_API_KEY}`;
    const ytPromise = axios.get(ytUrl).catch(() => null);
    
    // 2. Google Search for PDFs
    const pdfUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(topic + " filetype:pdf")}&api_key=${SERP_API_KEY}`;
    const pdfPromise = axios.get(pdfUrl).catch(() => null);
    
    // 3. Google Search for Important Questions
    const qsUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(topic + " important questions exam")}&api_key=${SERP_API_KEY}`;
    const qsPromise = axios.get(qsUrl).catch(() => null);

    const [ytRes, pdfRes, qsRes] = await Promise.all([ytPromise, pdfPromise, qsPromise]);

    const videos = ytRes?.data?.video_results?.slice(0, 6).map(v => ({
      title: v.title,
      link: v.link,
      thumbnail: v.thumbnail?.static || v.thumbnail?.url
    })) || [];

    const pdfs = pdfRes?.data?.organic_results?.filter(r => r.link.endsWith('.pdf')).slice(0, 6).map(r => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet
    })) || [];

    // Fallback if no specific PDFs found, just grab some top results
    if (pdfs.length === 0 && pdfRes?.data?.organic_results) {
        pdfRes.data.organic_results.slice(0, 3).forEach(r => {
            pdfs.push({ title: r.title, link: r.link, snippet: r.snippet });
        });
    }

    let questions = [];
    if (qsRes?.data?.related_questions) {
      questions = qsRes.data.related_questions.slice(0, 6).map(q => q.question);
    } else if (qsRes?.data?.organic_results) {
      questions = qsRes.data.organic_results.slice(0, 6).map(r => r.title);
    }

    // Dynamic quiz integration for the topic
    const fallbackQuiz = JSON.parse(localFallback('quiz', topic));

    res.json({
      topic,
      videos,
      pdfs,
      questions,
      quiz: fallbackQuiz.quiz || fallbackQuiz.questions,
    });

  } catch (err) {
    console.error('[Topic Search] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch topic data from SerpAPI' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 SmartLearn AI Backend v2.0 running on port ${PORT}`);
  console.log(`   AI Pipeline: Gemini → Grok → Local Fallback`);
  console.log(`   Endpoints: /api/health, /api/upload-pdf, /api/tutor, /api/generate-quiz, /api/youtube-topics\n`);
});
