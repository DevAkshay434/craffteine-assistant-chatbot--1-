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
        className={`px-3 py-2 rounded-lg text-sm ${message.formulaSummary || message.selectedIngredients ? 'max-w-full' : 'max-w-[80%]'} break-words ${
          isBot
            ? 'bg-white shadow-sm'
            : message.selectedIngredients ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 shadow-md' : 'bg-purple-600 text-white shadow-sm'
        }`}
      >
        {message.text && !message.selectedIngredients && (
          <p className={`${isBot ? 'text-gray-800' : 'text-white'} text-sm`}>
            {typeof message.text === 'string' ? message.text : JSON.stringify(message.text)}
          </p>
        )}
        
        {message.selectedIngredients && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-600 font-bold text-sm">✨ My Selected Formula:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {message.selectedIngredients.map((ing, idx) => (
                <div key={idx} className="bg-white p-2 rounded-lg border border-purple-200 shadow-sm">
                  <div className="font-semibold text-gray-900 text-xs mb-0.5">{ing.name}</div>
                  <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-2 py-0.5 rounded-full text-xs font-bold inline-block">
                    {ing.dosage} {ing.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {message.formulaSummary && (
          <div className="mt-4 space-y-4">
            <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-xl p-1 shadow-xl">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-center mb-3">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-5 py-2.5 rounded-full font-bold text-base shadow-lg">
                    🎉 {message.formulaSummary.formulaName || 'Your Custom Formula'} 🎉
                  </div>
                </div>
                
                {message.formulaSummary.deliveryFormat && (
                  <div className="text-center mb-3">
                    <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                      📦 {message.formulaSummary.deliveryFormat}
                    </span>
                  </div>
                )}
                
                <div className="space-y-2">
                  {message.formulaSummary.ingredients.map((ingredient, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-lg border-2 border-purple-200 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900 text-sm flex items-center">
                          <span className="text-2xl mr-2">✓</span>
                          {ingredient.name}
                        </span>
                        <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
                          {ingredient.suggested} {ingredient.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
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
