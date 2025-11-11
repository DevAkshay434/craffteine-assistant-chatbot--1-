import React, { useState, useEffect, useRef } from 'react';
import ChatWindow from './components/ChatWindow';
import { getNextStep } from './services/openaiService';
import { Message, Formula } from './types';
import { SparklesIcon } from './components/icons/SparklesIcon';
import emmaAvatar from './assets/emma-avatar.jpg';

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
    <div className="w-full h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-300 shadow-sm">
              <img src={emmaAvatar} alt="Emma" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Emma - Formula Builder</h2>
              <p className="text-xs text-gray-500">Personalized wellness consultant</p>
            </div>
          </div>
          {hasStarted && (
            <button
              onClick={resetChat}
              className="text-gray-600 hover:text-gray-800 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              New Chat
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {!hasStarted ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-6">
            <SparklesIcon className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">Create Your Custom Formula</h3>
          <p className="text-gray-600 mb-8 text-base max-w-md">
            Let Emma help you build a personalized wellness formula tailored to your goals
          </p>
          <button
            onClick={handleStart}
            className="px-8 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
          >
            Start Chat
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <ChatWindow messages={messages} isTyping={isTyping} onSelection={handleSelection} proceedUrl={proceedUrl} />
        </div>
      )}
    </div>
  );
};

export default App;
