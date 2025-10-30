
import React, { useState, useEffect, useRef } from 'react';
import { startChat, sendChatMessage } from '../services/geminiService';
import type { ChatMessage } from '../types';

interface LearningAssistantProps {
  courseTitle: string;
}

const LearningAssistant: React.FC<LearningAssistantProps> = ({ courseTitle }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startChat(courseTitle);
    setMessages([
      { sender: 'assistant', text: `Hello! I'm your assistant for "${courseTitle}". How can I help you today?` }
    ]);
  }, [courseTitle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(input);
      const assistantMessage: ChatMessage = { sender: 'assistant', text: response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: ChatMessage = { sender: 'assistant', text: "I'm sorry, I'm having trouble connecting right now. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl flex flex-col h-[70vh] max-w-4xl mx-auto">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-xl font-bold text-white text-center">Learning Assistant</h3>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md px-4 py-2 rounded-xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
              </div>
            </div>
          ))}
           {isLoading && (
            <div className="flex justify-start">
               <div className="max-w-xs px-4 py-2 rounded-xl bg-slate-700 text-slate-200">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                </div>
               </div>
            </div>
            )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-slate-700">
        <form onSubmit={handleSend} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-grow bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LearningAssistant;
