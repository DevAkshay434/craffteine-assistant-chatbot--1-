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
    // Parse ingredient selections to create visual display
    let selectedIngredients = undefined;
    let userMessageText = Array.isArray(value) ? value.join(', ') : value;
    
    if (component === 'Dosage' && typeof value === 'string') {
      try {
        const dosageMap = JSON.parse(value);
        const lastBotMessage = messages[messages.length - 1];
        if (lastBotMessage?.ingredients) {
          selectedIngredients = lastBotMessage.ingredients.map(ing => ({
            name: ing.name,
            dosage: dosageMap[ing.name] || ing.suggested,
            unit: ing.unit
          }));
          // Create a readable text version for the chat history
          userMessageText = selectedIngredients.map(ing => `${ing.name}: ${ing.dosage} ${ing.unit}`).join(', ');
        }
      } catch (e) {
        // If parsing fails, fall back to text display
        console.error('Failed to parse ingredient dosages:', e);
      }
    }
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMessageText,
      selectedIngredients,
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
                formulaSummary: response.formulaSummary,
            };

            const finalFormula = { ...newFormula, [component]: value };
            const queryParams = new URLSearchParams();
            
            Object.entries(finalFormula).forEach(([key, val]) => {
                if (!val) return;
                
                // Special handling for Dosage - parse and add individual ingredients with prefix and units
                if (key === 'Dosage' && typeof val === 'string') {
                    try {
                        const dosageMap = JSON.parse(val);
                        const lastBotMessage = messages[messages.length - 1];
                        
                        // Get units from the bot message ingredients
                        const ingredientUnits: { [key: string]: string } = {};
                        if (lastBotMessage?.ingredients) {
                            lastBotMessage.ingredients.forEach(ing => {
                                ingredientUnits[ing.name] = ing.unit;
                            });
                        }
                        
                        Object.entries(dosageMap).forEach(([ingredientName, dosage]) => {
                            // Add "ingredient_" prefix with dosage value and unit combined (e.g., "100mg")
                            const unit = ingredientUnits[ingredientName] || 'mg';
                            queryParams.append(`ingredient_${ingredientName}`, `${dosage}${unit}`);
                        });
                    } catch (e) {
                        // If parsing fails, just append as is
                        queryParams.append(key, val);
                    }
                } else {
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
    <div className="w-full min-h-screen flex items-center justify-center bg-transparent p-2">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-purple-200 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-5 h-5" />
            <div>
              <h2 className="text-lg font-bold">Formula Builder</h2>
              <p className="text-purple-100 text-xs">Personalized for you</p>
            </div>
          </div>
          {hasStarted && (
            <button
              onClick={resetChat}
              className="text-white hover:bg-white/20 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {!hasStarted ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-purple-50 to-pink-50">
            <SparklesIcon className="w-16 h-16 text-purple-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Create Your Formula</h3>
            <p className="text-gray-600 mb-6 text-sm max-w-sm">
              Build a personalized wellness formula tailored just for you
            </p>
            <button
              onClick={handleStart}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-full shadow-lg hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200"
            >
              Let's create your formula! 💜✨
            </button>
          </div>
        ) : (
          <div className="h-[500px]">
            <ChatWindow messages={messages} isTyping={isTyping} onSelection={handleSelection} proceedUrl={proceedUrl} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
