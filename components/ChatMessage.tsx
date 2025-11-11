import React from 'react';
import type { Message } from '../types';
import { UserIcon } from './icons/UserIcon';
import emmaAvatar from '../src/assets/emma-avatar.jpg';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';
  
  if (isBot && !message.text && !message.formulaSummary) {
    return null;
  }

  return (
    <div className={`flex items-start gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-200">
        {isBot ? (
          <img src={emmaAvatar} alt="Emma" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-purple-600 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
      
      {/* Message Content */}
      <div className={`flex-1 ${message.formulaSummary ? 'max-w-full' : 'max-w-2xl'}`}>
        {message.text && !message.selectedIngredients && (
          <div className={`px-4 py-3 rounded-2xl text-base ${
            isBot
              ? 'bg-gray-100 text-gray-900'
              : 'bg-purple-600 text-white'
          }`}>
            <p className="leading-relaxed">
              {typeof message.text === 'string' ? message.text : JSON.stringify(message.text)}
            </p>
          </div>
        )}
        
        {message.selectedIngredients && (
          <div className="bg-purple-50 px-4 py-3 rounded-2xl border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-purple-700 font-semibold text-sm">✨ My Selected Formula</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {message.selectedIngredients.map((ing, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-purple-100">
                  <div className="font-medium text-gray-900 text-sm mb-1">{ing.name}</div>
                  <div className="text-purple-600 text-sm font-semibold">
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
