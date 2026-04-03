const pdfParse = require('pdf-parse');

// ── NLP Engine ──────────────────────────────────────────
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

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function splitSentences(text) {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '. ').replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
  const raw = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
  return raw.map(s => s.trim()).filter(s => { const w = s.split(/\s+/); return w.length >= 5 && w.length <= 60 && s.length > 25; });
}

function extractiveSummarize(text, numSentences = 8) {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return text.substring(0, 1000);
  if (sentences.length <= numSentences) return sentences.join('\n\n');

  const sentenceTokens = sentences.map(s => tokenize(s));
  const df = {};
  sentenceTokens.forEach(tokens => { const unique = new Set(tokens); unique.forEach(w => { df[w] = (df[w] || 0) + 1; }); });

  const totalSentences = sentences.length;
  const scores = sentenceTokens.map((tokens, idx) => {
    if (tokens.length === 0) return { idx, score: 0 };
    const tf = {};
    tokens.forEach(w => { tf[w] = (tf[w] || 0) + 1; });
    let score = 0;
    Object.keys(tf).forEach(word => { score += (tf[word] / tokens.length) * Math.log(totalSentences / (df[word] || 1)); });
    if (idx < 3) score *= 1.3;
    if (idx === totalSentences - 1) score *= 1.1;
    if (tokens.length > 8) score *= 1.1;
    return { idx, score };
  });

  const topIndices = scores.sort((a, b) => b.score - a.score).slice(0, numSentences).map(s => s.idx).sort((a, b) => a - b);
  return topIndices.map(i => sentences[i]).join('\n\n');
}

function extractKeywords(text, topN = 5) {
  const tokens = tokenize(text);
  const freq = {};
  tokens.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, topN).map(([word]) => word);
}

function generateQuizFromText(text) {
  const sentences = splitSentences(text);
  const questions = [];
  const factSentences = sentences.filter(s => { const w = s.split(/\s+/); return w.length >= 8 && w.length <= 40; }).sort(() => 0.5 - Math.random());

  factSentences.slice(0, 5).forEach(sentence => {
    const words = tokenize(sentence);
    const candidates = words.filter(w => w.length >= 4);
    if (candidates.length === 0) return;
    const keyword = candidates[Math.floor(Math.random() * candidates.length)];
    const blanked = sentence.replace(new RegExp(keyword, 'i'), '________');
    const allKeywords = extractKeywords(text, 20);
    const distractors = allKeywords.filter(w => w !== keyword && w.length >= 3).sort(() => 0.5 - Math.random()).slice(0, 3);
    while (distractors.length < 3) distractors.push(['concept', 'method', 'process'][distractors.length] || 'system');
    const options = [keyword, ...distractors].sort(() => 0.5 - Math.random());
    questions.push({ question: `Fill in the blank: "${blanked}"`, options, answer: keyword });
  });

  while (questions.length < 3) {
    const kw = extractKeywords(text, 3);
    questions.push({ question: 'What is a key concept in this document?', options: [...kw, 'None of the above'].slice(0, 4), answer: kw[0] || 'None' });
  }
  return questions.slice(0, 5);
}

// ── Serverless Handler ──────────────────────────────────
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    // Read the raw body as buffer
    const chunks = [];
    for await (const chunk of req) { chunks.push(chunk); }
    const body = Buffer.concat(chunks);

    // Parse multipart form data manually
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Must be multipart/form-data with a PDF file' });
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) return res.status(400).json({ error: 'No boundary in content-type' });

    // Find PDF data in multipart body
    const bodyStr = body.toString('binary');
    const parts = bodyStr.split('--' + boundary);
    let pdfBuffer = null;

    for (const part of parts) {
      if (part.includes('application/pdf') || part.includes('.pdf')) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const dataStr = part.substring(headerEnd + 4);
          const trimmed = dataStr.endsWith('\r\n') ? dataStr.slice(0, -2) : dataStr;
          pdfBuffer = Buffer.from(trimmed, 'binary');
        }
      }
    }

    if (!pdfBuffer || pdfBuffer.length < 100) {
      return res.status(400).json({ error: 'No valid PDF file found in upload' });
    }

    // Parse PDF
    const data = await pdfParse(pdfBuffer);
    const rawText = data.text;

    if (!rawText || rawText.trim().length < 30) {
      return res.status(400).json({ error: 'Could not extract text. The PDF may be scanned/image-based.' });
    }

    const extractedText = rawText.substring(0, 6000);

    // NLP Processing
    const summary = extractiveSummarize(extractedText, 8);
    const quiz = generateQuizFromText(extractedText);
    const keywords = extractKeywords(extractedText, 5);
    const youtube_topics = keywords.map(kw => `${kw} explained tutorial`);
    if (youtube_topics.length < 3) youtube_topics.push('study tips', 'learn effectively');

    return res.json({ summary, quiz, youtube_topics });

  } catch (err) {
    console.error('[PDF] Error:', err.message);
    return res.status(500).json({ error: 'Failed to process PDF: ' + err.message });
  }
};
