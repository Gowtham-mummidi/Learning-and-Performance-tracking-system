import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Loader2, CheckCircle, RefreshCw, Award, Sparkles } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const QuizGenerator = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const generateQuiz = async (e) => {
    e?.preventDefault();
    if (!topic.trim()) return;
    setIsLoading(true);
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), difficulty }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.questions || data.questions.length === 0) throw new Error('No questions generated');

      setQuiz(data);
    } catch (err) {
      console.error('Quiz gen error:', err);
      setError(err.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const score = () => {
    if (!quiz?.questions) return 0;
    return quiz.questions.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);
  };

  const suggestedTopics = [
    'Photosynthesis', 'World War II', 'Python Programming',
    'Linear Algebra', 'Human Biology', 'Climate Change',
    'Machine Learning', 'Organic Chemistry'
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-gradient" style={{ marginBottom: '0.25rem' }}>AI Quiz Generator</h2>
        <p className="text-muted text-sm">Enter any topic and our AI will generate a custom quiz for you.</p>
      </div>

      {/* Topic Input */}
      <div className="glass-card no-hover">
        <form onSubmit={generateQuiz} className="flex flex-col gap-4">
          <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic (e.g., Quantum Physics, World History)"
              style={{ flex: 1, minWidth: '250px' }}
            />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{ width: '140px' }}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button
              type="submit"
              className="btn"
              disabled={!topic.trim() || isLoading}
              style={{ whiteSpace: 'nowrap' }}
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Quiz
                </>
              )}
            </button>
          </div>

          {/* Suggested Topics */}
          {!quiz && (
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

      {/* Quiz Content */}
      <AnimatePresence>
        {quiz && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-5"
          >
            <div className="flex justify-between items-center">
              <h3>
                <BookOpen size={20} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--accent)' }} />
                {quiz.title || `Quiz: ${topic}`}
              </h3>
              <span className="badge badge-accent">{difficulty} difficulty</span>
            </div>

            {quiz.questions?.map((q, qi) => (
              <motion.div
                key={qi}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qi * 0.05 }}
                className="quiz-question-card"
              >
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
                          name={`quiz-${qi}`}
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
              </motion.div>
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
                  Score: {score()} / {quiz.questions.length}
                </h2>
                <p className="text-muted text-sm mb-4">
                  {score() === quiz.questions.length
                    ? "🎉 Perfect! You've completely mastered this topic."
                    : score() >= quiz.questions.length / 2
                      ? "👍 Good work! Review the green answers for what you missed."
                      : "📖 Keep learning! Try reviewing the topic and taking the quiz again."}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    className="btn btn-secondary"
                    onClick={() => { setAnswers({}); setSubmitted(false); }}
                  >
                    <RefreshCw size={14} /> Retake
                  </button>
                  <button
                    className="btn"
                    onClick={() => { setQuiz(null); setAnswers({}); setSubmitted(false); }}
                  >
                    New Topic
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizGenerator;
