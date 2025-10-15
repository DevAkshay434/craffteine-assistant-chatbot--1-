import React from 'react';
import type { Message } from '../types';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';
import Markdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';
  // Don't render bot messages that are only containers for interactive elements without text
  if (isBot && !message.text) {
    return null;
  }

  return (
    <div className={`flex items-end gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md">
          <BotIcon className="w-5 h-5" />
        </div>
      )}
      <div
        className={`px-4 py-3 rounded-2xl max-w-sm md:max-w-md break-words ${
          isBot
            ? 'bg-white shadow-md rounded-bl-none'
            : 'bg-purple-600 text-white shadow-md rounded-br-none'
        }`}
      >
        <div className="prose prose-sm text-inherit">
             <p className="bg-white text-gray-800">{message.text}</p>
        </div>
      </div>
      {!isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center shadow-md">
            <UserIcon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
