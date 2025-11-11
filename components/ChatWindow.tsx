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
}

const ChatInput: React.FC<{ onSend: (text: string) => void; disabled: boolean }> = ({ onSend, disabled }) => {
  const [input, setInput] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        disabled={disabled}
        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
};

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isTyping, onSelection, proceedUrl }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];
  const isLastMessageFromBot = lastMessage?.sender === 'bot';
  const needsTextInput = isLastMessageFromBot && lastMessage?.inputType === 'text' && lastMessage?.component;

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
          
          {needsTextInput && !isTyping && (
            <ChatInput 
              onSend={(text) => onSelection(text, lastMessage.component!)} 
              disabled={isTyping}
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
