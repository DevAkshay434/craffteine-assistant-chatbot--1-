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
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md">
          <BotIcon className="w-5 h-5" />
        </div>
      )}
      <div
        className={`px-4 py-3 rounded-2xl ${message.formulaSummary ? 'max-w-full' : 'max-w-sm md:max-w-md'} break-words ${
          isBot
            ? 'bg-white shadow-md rounded-bl-none'
            : 'bg-purple-600 text-white shadow-md rounded-br-none'
        }`}
      >
        {message.text && (
          <p className={`${isBot ? 'text-gray-800' : 'text-white'}`}>{message.text}</p>
        )}
        
        {message.formulaSummary && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-lg">Your Custom Formula:</h4>
              <div className="space-y-3">
                {message.formulaSummary.ingredients.map((ingredient, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-gray-900">{ingredient.name}</span>
                      <span className="text-sm text-purple-600 font-medium">
                        {ingredient.suggested} {ingredient.unit}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{ingredient.rationale}</p>
                    <p className="text-xs text-gray-500">
                      Range: {ingredient.min}-{ingredient.max} {ingredient.unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            {message.formulaSummary.safetyNote && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-900">
                  <span className="font-semibold">Safety Note:</span> {message.formulaSummary.safetyNote}
                </p>
              </div>
            )}
            
            {message.formulaSummary.redirectUrl && (
              <a
                href={message.formulaSummary.redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-3 bg-green-500 text-white font-bold rounded-lg shadow-lg hover:bg-green-600 transition-all duration-200"
              >
                Proceed to Customize & Order
              </a>
            )}
          </div>
        )}
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
