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
                        onConfirm={(dosages) => onSelection(JSON.stringify(dosages), lastMessage.component!)} 
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
      <div ref={scrollRef} className="flex-grow p-3 space-y-3 overflow-y-auto">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
      </div>
      <div className="p-3 border-t border-gray-200 bg-white">
        {renderInteractiveComponent()}
        {proceedUrl && (
             <a
                href={proceedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full block text-center px-6 py-3 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white font-bold text-base rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 gradient-animate shimmer"
            >
                <span className="flex items-center justify-center gap-2">
                  <span>🎉</span>
                  <span>Complete Your Order</span>
                  <span>🎉</span>
                </span>
            </a>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
