import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Trash2 } from 'lucide-react';
import api from '../services/api';

const mobileStyle = `
  @media (max-width: 480px) {
    .chatbot-window {
      bottom: 0 !important;
      right: 0 !important;
      left: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      height: 100% !important;
      border-radius: 0 !important;
    }
  }
`;

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    <div className="flex gap-1">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickActions, setQuickActions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      const res = await api.get('/chatbot/history');
      if (res.data.length > 0) {
        setMessages(res.data.map(m => ({
          role: m.role,
          content: m.content,
          metadata: m.metadata,
          created_at: m.created_at
        })));
      } else {
        setMessages([{
          role: 'assistant',
          content: 'Hello! I\'m your ERP assistant. How can I help you today?\n\nBonjour ! Je suis votre assistant ERP. Comment puis-je vous aider ?',
          created_at: new Date().toISOString()
        }]);
      }
    } catch (error) {
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m your ERP assistant. How can I help you today?',
        created_at: new Date().toISOString()
      }]);
    }
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMessage = {
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setQuickActions([]);

    try {
      const res = await api.post('/chatbot/chat', { message: text });
      const botMessage = {
        role: 'assistant',
        content: res.data.text,
        metadata: { suggestions: res.data.suggestions, quickActions: res.data.quickActions },
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMessage]);
      if (res.data.quickActions && res.data.quickActions.length > 0) {
        setQuickActions(res.data.quickActions);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.\n\nDesole, une erreur s\'est produite. Veuillez reessayer.',
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.delete('/chatbot/history');
      setMessages([{
        role: 'assistant',
        content: 'Chat history cleared. How can I help you?\n\nHistorique efface. Comment puis-je vous aider ?',
        created_at: new Date().toISOString()
      }]);
      setQuickActions([]);
    } catch (error) {
      console.error('Failed to clear history');
    }
  };

  const handleQuickAction = (action) => {
    if (action.action === 'navigate' && action.path) {
      navigate(action.path);
      setIsOpen(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const defaultQuickActions = [
    { label: '📦 Products', action: 'navigate', path: '/products' },
    { label: '📋 Invoices', action: 'navigate', path: '/invoices' },
    { label: '👥 Contacts', action: 'navigate', path: '/contacts' },
    { label: '📁 Projects', action: 'navigate', path: '/projects' }
  ];

  const renderMessage = (msg, idx) => {
    const isUser = msg.role === 'user';
    return (
      <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        }`}>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
          <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
            {formatTime(msg.created_at)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{mobileStyle}</style>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <MessageCircle size={24} className="text-white" />
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden chatbot-window"
          style={{ height: 'min(560px, calc(100vh - 160px))' }}>

          <div className="px-5 py-4 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">ERP Assistant</h3>
                <p className="text-blue-100 text-xs">Online</p>
              </div>
            </div>
            <button
              onClick={handleClearHistory}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Clear history"
            >
              <Trash2 size={16} className="text-white/70" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-white">
            {messages.map((msg, idx) => renderMessage(msg, idx))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {(quickActions.length > 0 || (!isLoading && messages.length <= 1)) && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
              <div className="flex flex-wrap gap-1.5">
                {(quickActions.length > 0 ? quickActions : defaultQuickActions).map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about ERP features..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: inputValue.trim() ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : '#e5e7eb' }}
              >
                <Send size={18} className={inputValue.trim() ? 'text-white' : 'text-gray-400'} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
