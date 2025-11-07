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
    <div className="flex flex-col h-full bg-gray-50 rounded-b-2xl">
      <div ref={scrollRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
      </div>
      <div className="p-4 border-t border-gray-200">
        {renderInteractiveComponent()}
        {proceedUrl && (
             <a
                href={proceedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full block text-center px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-600 transition-all duration-200 transform hover:scale-105"
            >
                ✨ Complete Your Order ✨
            </a>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
