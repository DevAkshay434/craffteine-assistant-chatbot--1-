import React from 'react';
import { ChatIcon } from './icons/ChatIcon';
import { CloseIcon } from './icons/CloseIcon';

interface ChatBubbleProps {
  onClick: () => void;
  isOpen: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 w-16 h-16 bg-purple-600 rounded-full text-white flex items-center justify-center shadow-2xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 transition-transform duration-300 ease-in-out hover:scale-110"
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
        <div className={`transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180 scale-0' : 'rotate-0 scale-100'}`}>
            <ChatIcon className="w-8 h-8" />
        </div>
        <div className={`absolute transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-0 scale-100' : '-rotate-180 scale-0'}`}>
            <CloseIcon className="w-8 h-8" />
        </div>
    </button>
  );
};

export default ChatBubble;