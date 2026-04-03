const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { topic } = req.body || {};
  if (!topic) return res.status(400).json({ error: 'Please provide a topic' });

  const SERP_API_KEY = process.env.SERP_API_KEY || 'b4936c3977ddece4064f6f2e6e5855e9efa57d6655ad228eebe6dcf0404170a7';

  try {
    const [qsRes, pdfRes, ytRes] = await Promise.all([
      axios.get(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(topic + " important questions")}&api_key=${SERP_API_KEY}`).catch(() => null),
      axios.get(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(topic + " filetype:pdf")}&api_key=${SERP_API_KEY}`).catch(() => null),
      axios.get(`https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(topic + " tutorial")}&api_key=${SERP_API_KEY}`).catch(() => null),
    ]);

    const importantQA = (qsRes?.data?.related_questions || []).slice(0, 6).map(q => ({
      question: q.question, snippet: q.snippet || ''
    }));

    let pdfs = (pdfRes?.data?.organic_results || []).filter(r => r.link?.toLowerCase().endsWith('.pdf')).slice(0, 6).map(r => ({ title: r.title, link: r.link, snippet: r.snippet || '' }));
    if (pdfs.length === 0 && pdfRes?.data?.organic_results) {
      pdfs = pdfRes.data.organic_results.slice(0, 3).map(r => ({ title: r.title, link: r.link, snippet: r.snippet || '' }));
    }

    const relatedTopics = (qsRes?.data?.related_searches || []).slice(0, 6).map(r => r.query);
    if (relatedTopics.length === 0) relatedTopics.push(`${topic} basics`, `${topic} advanced`, `Learn ${topic}`);

    const videos = (ytRes?.data?.video_results || []).slice(0, 6).map(v => ({
      title: v.title, link: v.link, thumbnail: v.thumbnail?.static || v.thumbnail?.url || ''
    }));

    let questions = [];
    if (importantQA.length >= 3) {
      questions = importantQA.slice(0, 5).map(qa => ({
        question: qa.question,
        options: [qa.snippet ? qa.snippet.substring(0, 80) : 'See resources', 'Incorrect', 'Not related', 'None of the above'].sort(() => 0.5 - Math.random()),
        answer: qa.snippet ? qa.snippet.substring(0, 80) : 'See resources'
      }));
    } else {
      const bank = [
        { q: `What is the core principle of ${topic}?`, a: 'Fundamental theory', o: ['Fundamental theory', 'Random guessing', 'Unrelated', 'None'] },
        { q: `Why is ${topic} important?`, a: 'Builds critical thinking', o: ['No relevance', 'Builds critical thinking', 'Purely theoretical', 'Only for experts'] },
        { q: `Best approach to learn ${topic}?`, a: 'Active recall and practice', o: ['Skip practice', 'Active recall and practice', 'Read once', 'Ignore'] },
      ];
      questions = bank.map(b => ({ question: b.q, options: b.o.sort(() => 0.5 - Math.random()), answer: b.a }));
    }

    res.json({ title: `Web Scraped: ${topic}`, questions, importantQA, relatedTopics, pdfs, videos });

  } catch (err) {
    console.error('[Quiz] Error:', err.message);
    res.json({
      title: `Quiz: ${topic}`, questions: [{ question: `Core concept of ${topic}?`, options: ['Core theory', 'Random', 'Unrelated', 'None'], answer: 'Core theory' }],
      importantQA: [], relatedTopics: [], pdfs: [], videos: []
    });
  }
};
