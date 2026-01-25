
import React from 'react';
import { ChatMessage, MessageAuthor } from '../types';

interface ChatMessageProps {
  message: ChatMessage;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.author === MessageAuthor.USER;
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-[85%] group`}>
        <div className={`p-4 rounded-3xl shadow-2xl transition-all duration-300 ${
          isUser 
            ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-900/20' 
            : 'bg-slate-800/80 backdrop-blur-md border border-white/10 text-slate-100 rounded-tl-none'
        }`}>
          {message.image && (
            <div className="mb-3 overflow-hidden rounded-2xl border border-white/10">
              <img src={message.image} alt="Uploaded data" className="max-w-full h-auto object-cover hover:scale-105 transition-transform duration-500" />
            </div>
          )}
          <p className="text-sm font-semibold whitespace-pre-wrap leading-relaxed tracking-tight">
            {message.content}
          </p>
        </div>
        <div className={`mt-2 px-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ${isUser ? 'text-right' : 'text-left'}`}>
          {isUser ? 'Encrypted Link' : 'GEI Core Analysis'}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageComponent;
