import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Layers, CheckCircle, RefreshCw, Award, Sparkles, HelpCircle, FileText, Link as LinkIcon, PlayCircle } from 'lucide-react';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

const QuizGenerator = () => {
  const [topic, setTopic] = useState('');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('quiz');

  const generateData = async (e) => {
    e?.preventDefault();
    if (!topic.trim()) return;
    setIsLoading(true);
    setData(null);
    setAnswers({});
    setSubmitted(false);
    setError('');
    setActiveTab('quiz');

    try {
      const res = await fetch(`${API_BASE}/api/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);
      if (!json.questions || json.questions.length === 0) throw new Error('No questions generated');

      setData(json);
    } catch (err) {
      console.error('Gen error:', err);
      setError(err.message || 'Failed to generate data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const score = () => {
    if (!data?.questions) return 0;
    return data.questions.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);
  };

  const suggestedTopics = [
    'Photosynthesis', 'World War II', 'Python Programming',
    'Linear Algebra', 'Human Biology', 'Climate Change',
    'Machine Learning', 'Organic Chemistry'
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-gradient" style={{ marginBottom: '0.25rem' }}>Smart Quiz & Web Scraper</h2>
        <p className="text-muted text-sm">Enter any topic. We use SerpAPI to scrape PDFs, important PAA Q&A, and generate quizzes dynamically.</p>
      </div>

      {/* Topic Input */}
      <div className="glass-card no-hover">
        <form onSubmit={generateData} className="flex flex-col gap-4">
          <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic (e.g., Quantum Physics, World History)"
              style={{ flex: 1, minWidth: '250px' }}
            />
            <button
              type="submit"
              className="btn"
              disabled={!topic.trim() || isLoading}
              style={{ whiteSpace: 'nowrap' }}
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Scraping Web...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Analyze Topic
                </>
              )}
            </button>
          </div>

          {!data && (
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              <span className="text-xs text-muted" style={{ alignSelf: 'center' }}>Try:</span>
              {suggestedTopics.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setTopic(t)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border)',
                    fontSize: '0.75rem'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="login-error text-left" style={{ padding: '0.75rem 1rem' }}>
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card no-hover overflow-hidden" style={{ padding: 0 }}>
            {/* Tab Bar */}
            <div className="tab-bar">
              <button className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`} onClick={() => setActiveTab('quiz')}>
                <BookOpen size={16} /> Quiz
              </button>
              <button className={`tab-btn ${activeTab === 'paa' ? 'active-accent' : ''}`} onClick={() => setActiveTab('paa')}>
                <HelpCircle size={16} /> Important Q&A
              </button>
              <button className={`tab-btn ${activeTab === 'related' ? 'active-secondary' : ''}`} onClick={() => setActiveTab('related')}>
                <Layers size={16} /> Related Topics
              </button>
              <button className={`tab-btn ${activeTab === 'pdf' ? 'active-red' : ''}`} onClick={() => setActiveTab('pdf')}>
                <FileText size={16} /> Find PDFs
              </button>
              <button className={`tab-btn ${activeTab === 'youtube' ? 'active-red' : ''}`} onClick={() => setActiveTab('youtube')}>
                <PlayCircle size={16} /> Videos
              </button>
            </div>

            <div className="p-6">
              
              {/* Quiz Tab */}
              {activeTab === 'quiz' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
                  <h3 style={{ marginBottom: '0.5rem' }}>
                    <span className="text-gradient">Dynamic Quiz: {data.title}</span>
                  </h3>
                  
                  {data.questions?.map((q, qi) => (
                    <div key={qi} className="quiz-question-card">
                      <p className="font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {qi + 1}. {q.question}
                      </p>
                      <div className="grid grid-2 gap-2">
                        {q.options?.map((opt, oi) => {
                          let className = 'quiz-option';
                          if (submitted) {
                            if (opt === q.answer) className += ' correct';
                            else if (answers[qi] === opt) className += ' incorrect';
                          } else if (answers[qi] === opt) {
                            className += ' selected';
                          }
                          return (
                            <label key={oi} className={className}>
                              <input type="radio" name={`q-${qi}`} value={opt} checked={answers[qi] === opt} onChange={() => !submitted && setAnswers({ ...answers, [qi]: opt })} className="hidden" />
                              <div className="quiz-radio">
                                {answers[qi] === opt && <div className="quiz-radio-inner" />}
                              </div>
                              <span className="text-sm">{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {!submitted ? (
                    <button className="btn btn-accent w-fit" onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length === 0} style={{ alignSelf: 'center' }}>
                      <CheckCircle size={16} /> Submit Answers
                    </button>
                  ) : (
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="score-card">
                      <Award size={40} style={{ color: 'var(--accent)', margin: '0 auto 1rem', display: 'block' }} />
                      <h2 style={{ marginBottom: '0.5rem' }}>Score: {score()} / {data.questions.length}</h2>
                      <div className="flex gap-3 justify-center mt-4">
                        <button className="btn btn-secondary" onClick={() => { setAnswers({}); setSubmitted(false); }}>
                          <RefreshCw size={14} /> Retake
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Important Q&A Tab */}
              {activeTab === 'paa' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 style={{ marginBottom: '1rem' }} className="text-gradient-accent">Important Scraped Q&A</h3>
                  <div className="flex flex-col gap-3">
                    {data.importantQA?.map((qa, i) => (
                      <div key={i} className="glass-card" style={{ padding: '1rem' }}>
                        <p className="font-bold mb-2">Q: {qa.question}</p>
                        {qa.snippet && <p className="text-sm text-muted">A: {qa.snippet}</p>}
                      </div>
                    ))}
                    {(!data.importantQA || data.importantQA.length === 0) && (
                      <p className="text-muted text-sm">No specific Q&A found from the web.</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Related Topics Tab */}
              {activeTab === 'related' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 style={{ marginBottom: '1rem' }} className="text-secondary">Related Topics to Explore</h3>
                  <div className="grid grid-2 gap-3">
                    {data.relatedTopics?.map((rt, i) => (
                      <div key={i} className="glass-card flex items-center justify-between" style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => { setTopic(rt); generateData(); }}>
                        <span className="font-semibold text-sm">{rt}</span>
                        <LinkIcon size={14} className="text-muted" />
                      </div>
                    ))}
                    {(!data.relatedTopics || data.relatedTopics.length === 0) && (
                      <p className="text-muted text-sm">No related topics found.</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* PDF Tab */}
              {activeTab === 'pdf' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 style={{ marginBottom: '1rem' }} className="text-primary">PDF Study Materials Found</h3>
                  <div className="flex flex-col gap-3">
                    {data.pdfs?.map((pdf, i) => (
                      <a key={i} href={pdf.link} target="_blank" rel="noopener noreferrer" className="glass-card flex items-start gap-4 hover-lift" style={{ padding: '1rem' }}>
                        <FileText size={24} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                        <div>
                          <h4 style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>{pdf.title}</h4>
                          <p className="text-xs text-muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pdf.snippet || pdf.link}</p>
                        </div>
                      </a>
                    ))}
                    {(!data.pdfs || data.pdfs.length === 0) && (
                      <p className="text-muted text-sm">No PDF materials found for this topic.</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* YouTube Tab */}
              {activeTab === 'youtube' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 style={{ marginBottom: '1rem' }} className="text-secondary">Related YouTube Tutorials</h3>
                  <div className="grid grid-3 gap-3">
                    {data.videos?.map((v, i) => (
                      <a key={i} href={v.link} target="_blank" rel="noopener noreferrer" className="glass-card flex flex-col gap-2 hover-lift" style={{ padding: '0.75rem' }}>
                        {v.thumbnail ? (
                          <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} />
                        ) : (
                          <div style={{ width: '100%', height: '120px', background: 'var(--bg-secondary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PlayCircle size={32} style={{ opacity: 0.5 }} />
                          </div>
                        )}
                        <h4 style={{ fontSize: '0.85rem', marginBottom: 0 }}>{v.title}</h4>
                      </a>
                    ))}
                    {(!data.videos || data.videos.length === 0) && (
                      <p className="text-muted text-sm">No videos found for this topic.</p>
                    )}
                  </div>
                </motion.div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizGenerator;
