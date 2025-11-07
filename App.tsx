import React, { useState, useEffect, useRef } from 'react';
import ChatWindow from './components/ChatWindow';
import { getNextStep } from './services/openaiService';
import { Message, Formula } from './types';
import { SparklesIcon } from './components/icons/SparklesIcon';

// This key is for demonstration. In a production app, this should be handled securely on a backend.
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [formula, setFormula] = useState<Formula>({});
  const [proceedUrl, setProceedUrl] = useState<string | null>(null);

  const conversationHistoryRef = useRef<Message[]>([]);

  useEffect(() => {
    conversationHistoryRef.current = messages;
  }, [messages]);

  const resetChat = () => {
    setMessages([]);
    setHasStarted(false);
    setIsTyping(false);
    setFormula({});
    setProceedUrl(null);
  };

  const handleStart = async () => {
    setHasStarted(true);
    setIsTyping(true);

    const welcomeMessage: Message = {
      id: 'start',
      sender: 'bot',
      text: "Let's create your perfect wellness formula! 💜✨",
    };
    setMessages([welcomeMessage]);

    // FIX: Pass an empty formula object as the third argument to getNextStep.
    const response = await getNextStep(OPENAI_API_KEY, [], {});
    
    if (response) {
      setMessages(prev => [...prev, response]);
    } else {
       const errorMessage: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        text: "Sorry, I'm having trouble getting started. Please try again later.",
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    setIsTyping(false);
  };
  
  const handleSelection = async (value: string | string[], component: string) => {
    const userMessageText = Array.isArray(value) ? value.join(', ') : value;
    const newUserMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMessageText,
    };

    const newFormula = { ...formula, [component]: value };
    setFormula(newFormula);

    const currentHistory = [...conversationHistoryRef.current, newUserMessage];
    setMessages(currentHistory);
    setIsTyping(true);
    
    const response = await getNextStep(OPENAI_API_KEY, currentHistory, newFormula);

    if (response) {
        if (response.isComplete) {
            const finalMessage: Message = {
                id: Date.now().toString(),
                sender: 'bot',
                text: response.text,
            };

            const finalFormula = { ...newFormula, [component]: value };
            const queryParams = new URLSearchParams();
            Object.entries(finalFormula).forEach(([key, val]) => {
                if (val) {
                    queryParams.append(key, Array.isArray(val) ? val.join(',') : val);
                }
            });
            
            setProceedUrl(`https://crafftein.myshopify.com/products/customize-crafttein-formula?${queryParams.toString()}`);
            setMessages(prev => [...prev, finalMessage]);

        } else {
            setMessages(prev => [...prev, response]);
        }
    } else {
        const errorMessage: Message = {
            id: Date.now().toString(),
            sender: 'bot',
            text: "Sorry, I've run into an issue. Please try refreshing.",
        };
        setMessages(prev => [...prev, errorMessage]);
    }
    setIsTyping(false);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-transparent">
      <div className="w-full max-w-4xl h-full md:h-auto md:max-h-[700px] bg-white md:rounded-2xl md:shadow-2xl md:border md:border-purple-200 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Craffteine Formula Builder</h2>
              <p className="text-purple-100 text-sm">Personalized wellness formulas, just for you</p>
            </div>
          </div>
          {hasStarted && (
            <button
              onClick={resetChat}
              className="text-white hover:bg-white/20 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
            >
              Start Over
            </button>
          )}
        </div>

        {!hasStarted ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-purple-50 to-pink-50 flex-1">
            <SparklesIcon className="w-24 h-24 text-purple-500 mb-6" />
            <h3 className="text-3xl font-bold text-gray-800 mb-3">Create Your Perfect Formula</h3>
            <p className="text-gray-600 mb-8 max-w-md text-lg">
              Let's build a personalized energy and wellness formula tailored just for you!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-lg rounded-full shadow-lg hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105"
            >
              Let's create your perfect wellness formula! 💜✨
            </button>
          </div>
        ) : (
          <div className="h-[600px]">
            <ChatWindow messages={messages} isTyping={isTyping} onSelection={handleSelection} proceedUrl={proceedUrl} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
