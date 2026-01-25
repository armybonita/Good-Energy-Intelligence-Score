
import React, { useState, useRef } from 'react';

interface ChatInputProps {
  onSendMessage: (text: string, image?: { data: string; mimeType: string }) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((text.trim() || fileInputRef.current?.files?.[0]) && !isLoading) {
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = (reader.result as string).split(',')[1];
          onSendMessage(text, { data: base64Data, mimeType: file.type });
          setText('');
          if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsDataURL(file);
      } else {
        onSendMessage(text);
        setText('');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-slate-950/80 border-t border-white/5">
      <div className="flex gap-4 items-center bg-white/5 p-2 rounded-2xl border border-white/10 focus-within:border-blue-500 transition-all">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={() => setText(prev => prev || "이미지를 분석해줘.")}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-slate-400 hover:text-blue-400 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="메시지 입력 또는 사진 첨부..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
          disabled={isLoading}
        />
        <button
          disabled={isLoading || (!text.trim() && !fileInputRef.current?.files?.length)}
          className="bg-blue-600 p-3 rounded-xl hover:bg-blue-500 disabled:opacity-50 shadow-lg shadow-blue-900/40 transition-all"
        >
          {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
