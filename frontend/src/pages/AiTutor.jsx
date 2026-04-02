import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Brain, User, Loader2, Sparkles, Trash2 } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const AiTutor = () => {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: "Hello! 👋 I'm your SmartLearn AI Tutor. I can help you understand any topic, solve problems, or explain concepts. What would you like to learn about today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply || 'Sorry, I could not generate a response. Please try again.' }]);
    } catch (err) {
      console.error('Tutor error:', err);
      setMessages(prev => [...prev, { role: 'ai', content: "I'm having trouble connecting right now. Please check if the backend server is running on port 5000." }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'ai',
      content: "Chat cleared! What would you like to learn about?"
    }]);
  };

  const quickQuestions = [
    "Explain photosynthesis simply",
    "What is machine learning?",
    "Help me with calculus derivatives",
    "Explain Newton's laws of motion",
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-gradient" style={{ marginBottom: '0.25rem' }}>AI Tutor</h2>
          <p className="text-muted text-sm">Ask any question — your personal AI tutor is ready to help.</p>
        </div>
        <button className="btn btn-secondary" onClick={clearChat}>
          <Trash2 size={14} /> Clear
        </button>
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {quickQuestions.map((q, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="btn btn-secondary text-xs"
              onClick={() => { setInput(q); }}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              <Sparkles size={12} /> {q}
            </motion.button>
          ))}
        </div>
      )}

      {/* Chat Container */}
      <div className="glass-card no-hover overflow-hidden" style={{ padding: 0 }}>
        {/* Messages */}
        <div className="chat-messages" style={{ minHeight: '400px' }}>
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`chat-bubble ${msg.role}`}
              >
                <div className="flex items-center gap-2 mb-2" style={{ opacity: 0.7 }}>
                  {msg.role === 'ai' ? <Brain size={14} /> : <User size={14} />}
                  <span className="text-xs font-semibold">
                    {msg.role === 'ai' ? 'SmartLearn AI' : 'You'}
                  </span>
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="chat-bubble ai"
            >
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm text-muted">Thinking...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} className="chat-input-area">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
            style={{ flex: 1, borderRadius: 'var(--radius-full)' }}
          />
          <button
            type="submit"
            className="btn"
            disabled={!input.trim() || isLoading}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.65rem 1.25rem' }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiTutor;
