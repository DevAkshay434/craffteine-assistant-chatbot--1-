import React, { useState, useEffect, useRef } from 'react';
import ChatWindow from './components/ChatWindow';
import ChatBubble from './components/ChatBubble';
import { getNextStep } from './services/openaiService';
import { Message, Formula } from './types';
import { SparklesIcon } from './components/icons/SparklesIcon';

// This key is for demonstration. In a production app, this should be handled securely on a backend.
const OPENAI_API_KEY =import.meta.env.VITE_OPENAI_API_KEY ;

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
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
      text: "Help me build an energy blend ⚡",
    };
    setMessages([welcomeMessage]);

    // FIX: Pass an empty formula object as the third argument to getNextStep.
    const response = await getNextStep(OPENAI_API_KEY, [], {});
    
    if (response) {
      const firstQuestion: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        ...response,
      };
      setMessages(prev => [...prev, firstQuestion]);
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
            const nextQuestion: Message = {
                id: Date.now().toString(),
                sender: 'bot',
                ...response,
            };
            setMessages(prev => [...prev, nextQuestion]);
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

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    if (isOpen) { // Logic when closing the chat
        resetChat();
    }
  };

  return (
    <>
      <div className={`fixed bottom-24 right-5 z-50 w-full max-w-sm h-[70vh] max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <header className="flex items-center justify-between p-4 bg-purple-600 text-white rounded-t-2xl shadow-md">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5" />
            <h1 className="text-lg font-bold">Craffteine Assistant</h1>
          </div>
        </header>
        
        {!hasStarted ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50 rounded-b-2xl">
                <h2 className="text-2xl font-bold text-gray-800">Build Your Energy Blend</h2>
                <p className="mt-2 text-gray-600">Let's create the perfect formula for you, step-by-step.</p>
                <button 
                    onClick={handleStart}
                    className="mt-6 px-8 py-3 bg-purple-600 text-white font-bold rounded-lg shadow-lg hover:bg-purple-700 transition-all duration-200"
                >
                    Start
                </button>
            </div>
        ) : (
            <ChatWindow
              messages={messages}
              isTyping={isTyping}
              onSelection={handleSelection}
              proceedUrl={proceedUrl}
            />
        )}
      </div>
      <ChatBubble onClick={toggleChat} isOpen={isOpen} />
    </>
  );
};

export default App;
