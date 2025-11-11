import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import OptionButton from './OptionButton';
import RangeSlider from './RangeSlider';
import MultiSelectOptions from './MultiSelectOptions';
import InlineTextInput from './InlineTextInput';
import IngredientSliders from './IngredientSliders';

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  onSelection: (value: string | string[], component: string) => void;
  proceedUrl: string | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isTyping, onSelection, proceedUrl }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];
  const isLastMessageFromBot = lastMessage?.sender === 'bot';

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
        case 'options':
            return (
                <div className="flex flex-wrap gap-2 justify-center mt-3 px-4">
                    {lastMessage.options?.map(option => (
                        <OptionButton key={option} text={option} onClick={() => onSelection(option, lastMessage.component!)} disabled={false} />
                    ))}
                </div>
            );
        case 'multiselect':
            return (
                 <div className="mt-3 flex justify-center px-4">
                    <MultiSelectOptions options={lastMessage.options || []} onConfirm={(opts) => onSelection(opts, lastMessage.component!)} disabled={false} />
                 </div>
            );
        case 'slider':
            return (
                <div className="mt-3 flex justify-center px-4">
                    <RangeSlider config={lastMessage.sliderConfig!} onConfirm={(val) => onSelection(val, lastMessage.component!)} disabled={false} />
                </div>
            );

        case 'text':
             return (
                <div className="mt-3 flex justify-center px-4  text-gray-800">
                    <InlineTextInput onConfirm={(text) => onSelection(text, lastMessage.component!)} disabled={false} />
                </div>
            );
        
        case 'ingredient_sliders':
            return lastMessage.ingredients ? (
                <div className="mt-3 px-4 max-h-96 overflow-y-auto">
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
