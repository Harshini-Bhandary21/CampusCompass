'use client';
import { useState, useRef, useEffect } from 'react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('chatbot_session_id');
      if (!id) {
        id = `session_${Date.now()}_${Math.random()}`;
        localStorage.setItem('chatbot_session_id', id);
      }
      return id;
    }
    return `session_${Date.now()}_${Math.random()}`;
  });
  const messagesEndRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [awaitingFile, setAwaitingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatbot_messages');
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch (e) {
        }
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem('chatbot_messages', JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const currentPage = typeof window !== 'undefined' ? window.location.pathname : '/';
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          sessionId,
          currentPage 
        }),
      });

      const data = await response.json();

      if (data.response === 'VALIDATE_EXCEL_NOW') {
        const botMessage = {
          role: 'assistant', 
          content: 'Validating your uploaded timetable data...',
          cached: false
        };
        setMessages(prev => [...prev, botMessage]);
        
        try {
          const validateResponse = await fetch('/api/generate-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ validateFromDB: true })
          });
          const result = await validateResponse.json();
          
          const aiResponse = await fetch('/api/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: `Analyze this validation output and provide a friendly response: ${result.consoleOutput}`,
              sessionId,
              currentPage: window.location.pathname
            })
          });
          const aiData = await aiResponse.json();
          
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: aiData.response
          }]);
        } catch (error) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Error running validation. Please try again.'
          }]);
        }
      } else if (data.response === 'GENERATE_TEMPLATE_NOW') {
        const botMessage = {
          role: 'assistant', 
          content: 'Generating your Excel template...',
          cached: false 
        };
        setMessages(prev => [...prev, botMessage]);
        
        const templateResponse = await fetch('/api/generate-template');
        if (templateResponse.ok) {
          const blob = await templateResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'timetable_template.xlsx';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          const successMessage = { 
            role: 'assistant', 
            content: 'Template downloaded successfully! The Excel file has 5 sheets: Rooms, Time, Student, Faculty, and Subject. Fill in your data and upload it to generate your timetable.',
            cached: false 
          };
          setMessages(prev => [...prev, successMessage]);
        } else {
          const errorMessage = { 
            role: 'assistant', 
            content: 'Failed to generate template. Please try again.',
            cached: false 
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        const botMessage = { 
          role: 'assistant', 
          content: data.response,
          cached: data.cached 
        };
        setMessages(prev => [...prev, botMessage]);
        
        if (data.response.toLowerCase().includes('upload your excel')) {
          setAwaitingFile(true);
        }
      }
    } catch (error) {
      const errorMsg = error.response?.status === 429 
        ? 'API quota exceeded. Please try again later.'
        : 'Error: Unable to get response';
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMsg
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative group bg-gradient-to-br from-[#3c6e71] via-[#2a5a5d] to-[#3c6e71] text-white p-4 rounded-full shadow-2xl hover:shadow-[0_0_40px_rgba(60,110,113,0.8)] transition-all duration-300 hover:scale-110 animate-pulse"
        style={{ boxShadow: '0 10px 40px rgba(60, 110, 113, 0.5)' }}
      >
        {/* Animated rings */}
        <div className="absolute inset-0 rounded-full border-2 border-[#3c6e71] animate-ping opacity-75"></div>
        <div className="absolute inset-0 rounded-full border-2 border-[#3c6e71] animate-pulse"></div>
        
        {/* Online indicator */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-white shadow-lg">
          <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
        </div>
        
        {/* Sparkle effects */}
        <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-blue-300 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
        
        {isOpen ? (
          <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-6 h-6 relative z-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            <circle cx="12" cy="10" r="1.5"/>
            <circle cx="8" cy="10" r="1.5"/>
            <circle cx="16" cy="10" r="1.5"/>
          </svg>
        )}
        {isHovered && !isOpen && (
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-5 py-3 rounded-xl text-sm whitespace-nowrap shadow-2xl border border-gray-700 animate-fade-in">
            <span className="font-bold text-[#3c6e71]">💬</span> Chat with Eklavya
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-l-8 border-l-gray-900 border-y-4 border-y-transparent"></div>
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[380px] h-[500px] bg-gradient-to-b from-gray-50 to-white border-2 border-[#3c6e71]/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-bottom">
          <div className="bg-gradient-to-r from-[#3c6e71] via-[#2a5a5d] to-[#3c6e71] text-white p-5 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-wide">Eklavya</h2>
                <p className="text-xs text-white/80 font-medium">(Automated Timetable Scheduler)</p>
              </div>
            </div>
            <div className="flex gap-2 relative z-10">
              <button 
                onClick={() => {
                  if (confirm('Clear chat history?')) {
                    setMessages([]);
                    localStorage.removeItem('chatbot_messages');
                  }
                }}
                className="hover:bg-white/20 rounded-full p-2 transition-all"
                title="Clear chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-2 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
      
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#3c6e71] to-[#2a5a5d] rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome to Eklavya!</h3>
                <p className="text-sm text-gray-600">Your automated timetable scheduling assistant.</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[75%] p-4 rounded-2xl shadow-md ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-[#3c6e71] to-[#2a5a5d] text-white rounded-br-sm' 
                    : 'bg-white border-2 border-gray-200 text-gray-800 rounded-bl-sm'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  {msg.cached && <span className="text-xs mt-2 block opacity-70">⚡ Instant reply</span>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white border-2 border-gray-200 p-4 rounded-2xl rounded-bl-sm shadow-md flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#3c6e71] rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-[#3c6e71] rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-[#3c6e71] rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Eklavya is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-5 border-t-2 border-gray-200 bg-white">
            {awaitingFile ? (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setLoading(true);
                      setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: 'Validating your Excel file...'
                      }]);
                      
                      const formData = new FormData();
                      formData.append('file', file);
                      
                      try {
                        const response = await fetch('/api/generate-template', {
                          method: 'POST',
                          body: formData
                        });
                        const result = await response.json();
                        
                        const aiResponse = await fetch('/api/chatbot', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            message: `Analyze this validation output and provide a friendly response: ${result.consoleOutput}`,
                            sessionId,
                            currentPage: window.location.pathname
                          })
                        });
                        const aiData = await aiResponse.json();
                        
                        setMessages(prev => [...prev, {
                          role: 'assistant',
                          content: aiData.response
                        }]);
                      } catch (error) {
                        setMessages(prev => [...prev, {
                          role: 'assistant',
                          content: 'Error validating file. Please try again.'
                        }]);
                      } finally {
                        setLoading(false);
                        setAwaitingFile(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gradient-to-br from-[#3c6e71] to-[#2a5a5d] text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Excel File
                </button>
                <button
                  type="button"
                  onClick={() => setAwaitingFile(false)}
                  className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about schedules, departments..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3c6e71] focus:border-transparent text-sm bg-gray-50 text-gray-900 placeholder:text-gray-500 transition-all"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-5 py-3 bg-gradient-to-br from-[#3c6e71] to-[#2a5a5d] text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
