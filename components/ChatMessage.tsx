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
          <div className="mt-4 space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                  ✨ Your Custom Formula ✨
                </div>
              </div>
              
              <div className="space-y-2">
                {message.formulaSummary.ingredients.map((ingredient, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-900 text-sm flex items-center">
                        <span className="text-purple-500 mr-2">●</span>
                        {ingredient.name}
                      </span>
                      <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow">
                        {ingredient.suggested} {ingredient.unit}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 ml-4">{ingredient.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {message.formulaSummary.safetyNote && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-3 shadow-sm">
                <p className="text-xs text-amber-900 flex items-start">
                  <span className="text-lg mr-2">⚠️</span>
                  <span><span className="font-bold">Safety Note:</span> {message.formulaSummary.safetyNote}</span>
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
