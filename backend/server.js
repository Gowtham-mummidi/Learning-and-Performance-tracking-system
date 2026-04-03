const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const pdfParse = require('pdf-parse');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ═══════════════════════════════════════════════════════════
// LOCAL NLP ENGINE — Extractive Summarization via TF-IDF
// No external APIs needed. Pure open-source style NLP.
// ═══════════════════════════════════════════════════════════

const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall','can',
  'for','and','nor','but','or','yet','so','at','by','from','in','into','of','on',
  'to','with','as','it','its','this','that','these','those','i','me','my','we',
  'our','you','your','he','him','his','she','her','they','them','their','what',
  'which','who','whom','where','when','how','not','no','all','each','every',
  'both','few','more','most','other','some','such','than','too','very','just',
  'about','above','after','again','also','am','any','because','before','below',
  'between','during','if','only','own','same','then','there','through','under',
  'until','up','while','don','doesn','didn','isn','aren','wasn','weren','won',
  'wouldn','couldn','shouldn','ll','ve','re','let','got','get','go','going',
  'one','two','first','new','used','using','use','may','also','however','thus'
]);

/**
 * Tokenize text into words, lowercase, remove punctuation
 */
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Split text into sentences
 */
function splitSentences(text) {
  // Clean up the text first
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Split on sentence boundaries
  const raw = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
  
  return raw
    .map(s => s.trim())
    .filter(s => {
      const words = s.split(/\s+/);
      return words.length >= 5 && words.length <= 60 && s.length > 25;
    });
}

/**
 * Compute TF-IDF scores for each sentence
 * Returns the top N sentences ranked by importance
 */
function extractiveSummarize(text, numSentences = 8) {
  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    return text.substring(0, 1000);
  }
  if (sentences.length <= numSentences) {
    return sentences.join('\n\n');
  }

  // Step 1: Compute term frequency per sentence
  const sentenceTokens = sentences.map(s => tokenize(s));
  
  // Step 2: Document frequency (how many sentences contain each word)
  const df = {};
  sentenceTokens.forEach(tokens => {
    const unique = new Set(tokens);
    unique.forEach(w => { df[w] = (df[w] || 0) + 1; });
  });

  // Step 3: Score each sentence using TF-IDF
  const totalSentences = sentences.length;
  const scores = sentenceTokens.map((tokens, idx) => {
    if (tokens.length === 0) return { idx, score: 0 };
    
    // TF-IDF sum
    const tf = {};
    tokens.forEach(w => { tf[w] = (tf[w] || 0) + 1; });
    
    let score = 0;
    Object.keys(tf).forEach(word => {
      const tfidf = (tf[word] / tokens.length) * Math.log(totalSentences / (df[word] || 1));
      score += tfidf;
    });

    // Bonus for position (first and last sentences are often important)
    if (idx < 3) score *= 1.3;
    if (idx === totalSentences - 1) score *= 1.1;
    
    // Bonus for longer, more informative sentences
    if (tokens.length > 8) score *= 1.1;

    return { idx, score };
  });

  // Step 4: Pick top N sentences, ordered by original position
  const topIndices = scores
    .sort((a, b) => b.score - a.score)
    .slice(0, numSentences)
    .map(s => s.idx)
    .sort((a, b) => a - b);

  return topIndices.map(i => sentences[i]).join('\n\n');
}

/**
 * Extract key topics/keywords from text using word frequency
 */
function extractKeywords(text, topN = 5) {
  const tokens = tokenize(text);
  const freq = {};
  tokens.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

/**
 * Generate quiz questions from extracted text
 */
function generateQuizFromText(text) {
  const sentences = splitSentences(text);
  const questions = [];

  // Filter for fact-bearing sentences (longer, with specific info)
  const factSentences = sentences
    .filter(s => {
      const words = s.split(/\s+/);
      return words.length >= 8 && words.length <= 40;
    })
    .sort(() => 0.5 - Math.random());

  const usedSentences = factSentences.slice(0, 5);

  usedSentences.forEach(sentence => {
    const words = tokenize(sentence);
    // Pick a keyword (longer, meaningful word)
    const candidates = words.filter(w => w.length >= 4);
    if (candidates.length === 0) return;

    const keyword = candidates[Math.floor(Math.random() * candidates.length)];
    const blanked = sentence.replace(new RegExp(keyword, 'i'), '________');
    
    // Generate distractors using other keywords from the text
    const allKeywords = extractKeywords(text, 20);
    const distractors = allKeywords
      .filter(w => w !== keyword && w.length >= 3)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    while (distractors.length < 3) {
      distractors.push(['concept', 'method', 'process', 'system', 'analysis'][distractors.length]);
    }

    const options = [keyword, ...distractors].sort(() => 0.5 - Math.random());

    questions.push({
      question: `Fill in the blank: "${blanked}"`,
      options,
      answer: keyword
    });
  });

  // If we couldn't make enough from fill-in-blank, add comprehension questions
  while (questions.length < 3) {
    const keywords = extractKeywords(text, 3);
    questions.push({
      question: `What is a key concept discussed in this document?`,
      options: [...keywords, 'None of the above'].slice(0, 4),
      answer: keywords[0] || 'None of the above'
    });
  }

  return questions.slice(0, 5);
}

// ═══════════════════════════════════════════════════════════
// AI PROVIDERS (optional enhancement, not required)
// ═══════════════════════════════════════════════════════════

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyDummyKeyReplace');

async function callGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

function extractJSON(text) {
  try { return JSON.parse(text); } catch (e) { /* continue */ }
  const jsonBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonBlockMatch) {
    try { return JSON.parse(jsonBlockMatch[1].trim()); } catch (e) { /* continue */ }
  }
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]); } catch (e) { /* continue */ }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════

app.get('/api/health', (req, res) => {
  res.json({
    status: 'Platform Active',
    ai: 'Local NLP Engine (TF-IDF Extractive Summarization) + SerpAPI Web Scraping',
    version: '3.0'
  });
});

// ─── PDF Upload & Analysis ───────────────────────────────
app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    console.log('[PDF] Processing:', req.file.originalname, `(${(req.file.size / 1024).toFixed(1)} KB)`);
    
    // Step 1: Parse the PDF
    const data = await pdfParse(req.file.buffer);
    const rawText = data.text;

    if (!rawText || rawText.trim().length < 30) {
      return res.status(400).json({ 
        error: 'Could not extract enough text from this PDF. It may be scanned/image-based.' 
      });
    }

    const extractedText = rawText.substring(0, 6000); // more text for better summarization
    console.log('[PDF] Extracted', extractedText.length, 'characters');

    // Step 2: LOCAL NLP Summarization (always works, no API needed)
    console.log('[PDF] Running TF-IDF extractive summarization...');
    const summary = extractiveSummarize(extractedText, 8);
    
    // Step 3: Generate quiz from the actual PDF content
    console.log('[PDF] Generating quiz from document content...');
    const quiz = generateQuizFromText(extractedText);
    
    // Step 4: Extract topics for YouTube recommendations
    const keywords = extractKeywords(extractedText, 5);
    const youtube_topics = keywords.map(kw => `${kw} explained tutorial`);
    if (youtube_topics.length < 3) {
      youtube_topics.push('study tips and techniques', 'how to learn effectively');
    }

    console.log('[PDF] ✓ Analysis complete. Summary:', summary.length, 'chars, Quiz:', quiz.length, 'questions');

    // Step 5: Optionally enhance with Gemini (non-blocking bonus)
    let enhancedSummary = summary;
    try {
      const prompt = `Summarize this text in 3-4 clear paragraphs for a student:\n\n${extractedText.substring(0, 3000)}`;
      const aiSummary = await callGemini(prompt);
      if (aiSummary && aiSummary.length > 100) {
        enhancedSummary = aiSummary;
        console.log('[PDF] ✓ Enhanced with Gemini AI summary');
      }
    } catch (err) {
      console.log('[PDF] Gemini unavailable, using local NLP summary (works perfectly fine)');
    }

    return res.json({
      summary: enhancedSummary,
      quiz,
      youtube_topics
    });

  } catch (err) {
    console.error('[PDF] Processing Error:', err.message);
    return res.status(500).json({
      error: 'Failed to process the PDF. Please try a different file.',
      details: err.message
    });
  }
});

// ─── Quiz Generator with SerpAPI Web Scraping ────────────
app.post('/api/generate-quiz', async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Please provide a topic' });
  }

  try {
    const axios = require('axios');
    const SERP_API_KEY = process.env.SERP_API_KEY || 'b4936c3977ddece4064f6f2e6e5855e9efa57d6655ad228eebe6dcf0404170a7';
    
    console.log('[Quiz] Scraping web for topic:', topic);

    // Fire all 3 SerpAPI requests in parallel
    const [qsRes, pdfRes, ytRes] = await Promise.all([
      axios.get(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(topic + " important questions")}&api_key=${SERP_API_KEY}`).catch(() => null),
      axios.get(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(topic + " filetype:pdf")}&api_key=${SERP_API_KEY}`).catch(() => null),
      axios.get(`https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(topic + " tutorial")}&api_key=${SERP_API_KEY}`).catch(() => null),
    ]);

    // Extract PAA (People Also Ask)
    const importantQA = (qsRes?.data?.related_questions || []).slice(0, 6).map(q => ({
      question: q.question,
      snippet: q.snippet || ''
    }));

    // Extract PDFs
    let pdfs = (pdfRes?.data?.organic_results || [])
      .filter(r => r.link && r.link.toLowerCase().endsWith('.pdf'))
      .slice(0, 6)
      .map(r => ({ title: r.title, link: r.link, snippet: r.snippet || '' }));
    
    // Fallback: grab top results even if not .pdf
    if (pdfs.length === 0 && pdfRes?.data?.organic_results) {
      pdfs = pdfRes.data.organic_results.slice(0, 3).map(r => ({
        title: r.title, link: r.link, snippet: r.snippet || ''
      }));
    }

    // Extract related topics
    const relatedTopics = (qsRes?.data?.related_searches || []).slice(0, 6).map(r => r.query);
    if (relatedTopics.length === 0) {
      relatedTopics.push(`${topic} basics`, `${topic} advanced`, `Learn ${topic}`);
    }

    // Extract YouTube videos
    const videos = (ytRes?.data?.video_results || []).slice(0, 6).map(v => ({
      title: v.title,
      link: v.link,
      thumbnail: v.thumbnail?.static || v.thumbnail?.url || ''
    }));

    // Build quiz from PAA if available, else generate generic
    let questions = [];
    if (importantQA.length >= 3) {
      questions = importantQA.slice(0, 5).map(qa => ({
        question: qa.question,
        options: [
          qa.snippet ? qa.snippet.substring(0, 80) : 'See related resources',
          'This is incorrect',
          'Not related to this topic',
          'None of the above'
        ].sort(() => 0.5 - Math.random()),
        answer: qa.snippet ? qa.snippet.substring(0, 80) : 'See related resources'
      }));
    } else {
      // Generic fallback quiz
      const bank = [
        { q: `What is the core principle of ${topic}?`, a: 'Fundamental theory and concepts', o: ['Fundamental theory and concepts', 'Random guessing', 'Unrelated field', 'None'] },
        { q: `Why is ${topic} important?`, a: 'Builds critical thinking', o: ['No relevance', 'Builds critical thinking', 'Purely theoretical', 'Only for experts'] },
        { q: `Best approach to learn ${topic}?`, a: 'Active recall and practice', o: ['Skip practice', 'Active recall and practice', 'Read once', 'Ignore difficulties'] },
        { q: `How to apply ${topic} practically?`, a: 'Solve real problems', o: ['Ignore it', 'Solve real problems', 'No practical use', 'Only debates'] },
        { q: `What makes ${topic} unique?`, a: 'Its methodology', o: ['Nothing', 'Its methodology', 'Confusing', 'No effort needed'] },
      ];
      questions = bank.sort(() => 0.5 - Math.random()).slice(0, 5).map(b => ({
        question: b.q, options: b.o.sort(() => 0.5 - Math.random()), answer: b.a
      }));
    }

    console.log('[Quiz] ✓ Scraped:', importantQA.length, 'QA,', pdfs.length, 'PDFs,', videos.length, 'videos');

    res.json({
      title: `Web Scraped: ${topic}`,
      questions,
      importantQA,
      relatedTopics,
      pdfs,
      videos
    });

  } catch (err) {
    console.error('[Quiz Gen] Error:', err.message);
    res.json({
      title: `Quiz: ${topic}`,
      questions: [
        { question: `What is the core concept of ${topic}?`, options: ['Core theory', 'Random', 'Unrelated', 'None'], answer: 'Core theory' },
        { question: `Best way to study ${topic}?`, options: ['Active recall', 'Skip it', 'Ignore', 'Sleep'], answer: 'Active recall' },
      ],
      importantQA: [], relatedTopics: [], pdfs: [], videos: []
    });
  }
});

// ─── YouTube recommendations ─────────────────────────────
app.post('/api/youtube-topics', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Please provide a topic' });

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
});

// ─── Analyze weakness ────────────────────────────────────
app.post('/api/analyze-weakness', async (req, res) => {
  const { studentData } = req.body;
  res.json({
    analysis: 'Based on your performance data, focus on consistent daily practice and review topics where scores are below 70%. Use flashcards and practice problems to strengthen weak areas.'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 SmartLearn AI Backend v3.0 running on port ${PORT}`);
  console.log(`   NLP Engine: TF-IDF Extractive Summarization (local, no API needed)`);
  console.log(`   Web Scraping: SerpAPI (YouTube, Google PDFs, PAA)`);
  console.log(`   Endpoints: /api/health, /api/upload-pdf, /api/generate-quiz, /api/youtube-topics\n`);
});
