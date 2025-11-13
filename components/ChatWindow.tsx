import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import IngredientSliders from './IngredientSliders';

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  onSelection: (value: string | string[], component: string) => void;
  proceedUrl: string | null;
  cooldownRemainingMs?: number;
}

const ChatInput: React.FC<{ 
  onSend: (text: string) => void; 
  disabled: boolean;
  cooldownRemainingMs?: number;
}> = ({ onSend, disabled, cooldownRemainingMs = 0 }) => {
  const [input, setInput] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const isOnCooldown = cooldownRemainingMs > 0;
  const cooldownSeconds = Math.ceil(cooldownRemainingMs / 1000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled && !isOnCooldown) {
      onSend(input.trim());
      setInput('');
      // Auto-focus the input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  // Auto-focus on mount
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div>
      {isOnCooldown && (
        <div className="mb-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-700 flex items-center gap-2">
          <span className="flex-shrink-0">✨</span>
          <span className="flex-1">Hold up—Emma needs a sec ({cooldownSeconds}s left)</span>
          <div className="w-16 h-1.5 bg-purple-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all duration-100"
              style={{ width: `${100 - (cooldownRemainingMs / 4000) * 100}%` }}
            />
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2.5">
        <button type="button" className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isOnCooldown ? `Wait ${cooldownSeconds}s...` : "Ask anything"}
          disabled={disabled || isOnCooldown}
          className="flex-1 bg-transparent focus:outline-none text-gray-800 placeholder-gray-400 disabled:cursor-not-allowed text-sm"
        />
        <button type="submit" disabled={disabled || !input.trim() || isOnCooldown} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 flex-shrink-0">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isTyping, onSelection, proceedUrl, cooldownRemainingMs = 0 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];
  const isLastMessageFromBot = lastMessage?.sender === 'bot';
  const showChatInput = isLastMessageFromBot && lastMessage?.component && !proceedUrl;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);
  
  const renderInteractiveComponent = () => {
    if (isTyping || !isLastMessageFromBot || !lastMessage.inputType || !lastMessage.component) {
        return null;
    }

    switch(lastMessage.inputType) {
        case 'ingredient_sliders':
            return lastMessage.ingredients ? (
                <div className="mb-3 max-h-96 overflow-y-auto">
                    <IngredientSliders 
                        ingredients={lastMessage.ingredients} 
                        onConfirm={(dosages) => onSelection(dosages, lastMessage.component!)} 
                        disabled={false} 
                    />
                </div>
            ) : null;
        
        default:
            return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      </div>
      
      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {renderInteractiveComponent()}
          
          {showChatInput && !isTyping && (
            <ChatInput 
              onSend={(text) => onSelection(text, lastMessage.component!)} 
              disabled={isTyping}
              cooldownRemainingMs={cooldownRemainingMs}
            />
          )}
          
          {proceedUrl && (
            <a
              href={proceedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full block text-center px-6 py-3 bg-purple-600 text-white font-semibold text-base rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 shadow-sm"
            >
              Complete Your Order →
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
