import React from 'react';
import type { Message } from '../types';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';
  
  if (isBot && !message.text && !message.formulaSummary) {
    return null;
  }

  return (
    <div className={`flex items-start gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center">
          <BotIcon className="w-4 h-4" />
        </div>
      )}
      <div
        className={`px-3 py-2 rounded-lg text-sm ${message.formulaSummary ? 'max-w-full' : 'max-w-[80%]'} break-words ${
          isBot
            ? 'bg-white shadow-sm'
            : 'bg-purple-600 text-white shadow-sm'
        }`}
      >
        {message.text && (
          <p className={`${isBot ? 'text-gray-800' : 'text-white'} text-sm`}>{message.text}</p>
        )}
        
        {message.formulaSummary && (
          <div className="mt-3 space-y-3">
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-base">Your Formula:</h4>
              <div className="space-y-2">
                {message.formulaSummary.ingredients.map((ingredient, idx) => (
                  <div key={idx} className="bg-gray-50 p-2 rounded border border-gray-200">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-gray-900 text-xs">{ingredient.name}</span>
                      <span className="text-xs text-purple-600 font-medium">
                        {ingredient.suggested} {ingredient.unit}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{ingredient.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {message.formulaSummary.safetyNote && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <p className="text-xs text-yellow-900">
                  <span className="font-semibold">Safety:</span> {message.formulaSummary.safetyNote}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      {!isBot && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
            <UserIcon className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
