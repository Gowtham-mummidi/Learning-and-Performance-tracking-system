import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, PlayCircle, Brain, CheckCircle, Loader2, X, RefreshCw, Award } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const StudentPdfLearning = () => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError('');
      setData(null);
      setAnswers({});
      setSubmitted(false);
    } else if (selected) {
      setError('Please select a valid PDF file.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped);
      setError('');
      setData(null);
      setAnswers({});
      setSubmitted(false);
    } else {
      setError('Please drop a valid PDF file.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError('');
    setData(null);
    setAnswers({});
    setSubmitted(false);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await fetch(`${API_BASE}/api/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Processing failed');
      }

      if (!result.summary && !result.quiz) {
        throw new Error('Received empty response from AI');
      }

      setData(result);
      setActiveTab('summary');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to analyze PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setData(null);
    setError('');
    setAnswers({});
    setSubmitted(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const quizScore = () => {
    if (!data?.quiz) return 0;
    return data.quiz.reduce((score, q, i) => score + (answers[i] === q.answer ? 1 : 0), 0);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h2 className="text-gradient" style={{ marginBottom: '0.25rem' }}>AI PDF Learning Lab</h2>
        <p className="text-muted text-sm">Upload study materials — our NLP engine extracts summaries, generates quizzes, and finds related YouTube videos.</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !file && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!file ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <UploadCloud size={48} style={{ color: 'var(--primary-light)', opacity: 0.7 }} />
            <h3 style={{ marginBottom: 0 }}>Drop your PDF here or click to browse</h3>
            <p className="text-sm text-muted">Supports .pdf files up to 10MB</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex items-center gap-3">
              <FileText size={28} style={{ color: 'var(--accent)' }} />
              <div>
                <p className="font-semibold">{file.name}</p>
                <p className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); clearFile(); }} className="btn-ghost" title="Remove file">
                <X size={18} />
              </button>
            </div>

            <button
              className={`btn ${isProcessing ? '' : 'btn-accent'}`}
              onClick={(e) => { e.stopPropagation(); handleUpload(); }}
              disabled={isProcessing}
              style={{ minWidth: '200px' }}
            >
              {isProcessing ? (
                <>
                  <span className="spinner" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Brain size={18} />
                  Start NLP Analysis
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="login-error"
            style={{ textAlign: 'left', padding: '0.75rem 1rem' }}
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-card no-hover overflow-hidden"
            style={{ padding: 0 }}
          >
            {/* Tab Bar */}
            <div className="tab-bar">
              <button
                className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                <FileText size={16} /> Summary
              </button>
              <button
                className={`tab-btn ${activeTab === 'quiz' ? 'active-accent' : ''}`}
                onClick={() => setActiveTab('quiz')}
              >
                <CheckCircle size={16} /> Quiz ({data.quiz?.length || 0})
              </button>
              <button
                className={`tab-btn ${activeTab === 'youtube' ? 'active-red' : ''}`}
                onClick={() => setActiveTab('youtube')}
              >
                <PlayCircle size={16} /> YouTube
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Summary Tab */}
              {activeTab === 'summary' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 style={{ marginBottom: '1rem' }}>
                    <span className="text-gradient">AI-Generated Summary</span>
                  </h3>
                  <div className="whitespace-pre-wrap leading-relaxed text-secondary-color text-sm" style={{ lineHeight: 1.8 }}>
                    {data.summary}
                  </div>
                </motion.div>
              )}

              {/* Quiz Tab */}
              {activeTab === 'quiz' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
                  <h3 style={{ marginBottom: '0.5rem' }}>
                    <span className="text-gradient-accent">Interactive Quiz</span>
                  </h3>

                  {data.quiz?.map((q, qi) => (
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
                              <input
                                type="radio"
                                name={`q-${qi}`}
                                value={opt}
                                checked={answers[qi] === opt}
                                onChange={() => !submitted && setAnswers({ ...answers, [qi]: opt })}
                                className="hidden"
                              />
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
                    <button
                      className="btn btn-accent w-fit"
                      onClick={() => setSubmitted(true)}
                      disabled={Object.keys(answers).length === 0}
                      style={{ alignSelf: 'center' }}
                    >
                      <CheckCircle size={16} /> Submit Answers
                    </button>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="score-card"
                    >
                      <Award size={40} style={{ color: 'var(--accent)', margin: '0 auto 1rem', display: 'block' }} />
                      <h2 style={{ marginBottom: '0.5rem' }}>
                        Score: {quizScore()} / {data.quiz.length}
                      </h2>
                      <p className="text-muted text-sm">
                        {quizScore() === data.quiz.length
                          ? "🎉 Perfect score! You've mastered this content."
                          : quizScore() >= data.quiz.length / 2
                            ? "👍 Good job! Review the highlighted answers to improve."
                            : "📖 Keep studying! Review the summary and try again."}
                      </p>
                      <button
                        className="btn btn-secondary mt-4"
                        onClick={() => { setAnswers({}); setSubmitted(false); }}
                      >
                        <RefreshCw size={14} /> Retake Quiz
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* YouTube Tab */}
              {activeTab === 'youtube' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 style={{ marginBottom: '1rem' }}>
                    Recommended YouTube Resources
                  </h3>
                  <div className="grid grid-2 gap-3">
                    {data.youtube_topics?.map((topic, idx) => (
                      <a
                        key={idx}
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="yt-card"
                      >
                        <PlayCircle className="yt-icon" size={28} />
                        <h4 className="yt-title mt-2" style={{ marginBottom: '0.25rem' }}>{topic}</h4>
                        <p className="text-xs text-muted">Click to search on YouTube</p>
                      </a>
                    ))}
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

export default StudentPdfLearning;
