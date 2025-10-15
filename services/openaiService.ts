import type { Message, Formula } from '../types';

const API_URL = 'https://api.openai.com/v1/chat/completions';

// FIX: Wrap JSON-like keys in backticks to prevent linting errors and for clarity in the prompt.
const systemInstruction = `You are a friendly and expert AI assistant for "Craffteine", a personalized supplement brand. Your ONLY goal is to guide a user through creating a custom energy blend by asking a series of questions, one at a time. You MUST follow this exact sequence:

1.  **Format:** Ask the user to select the format for their blend.
2.  **Ingredients:** Ask the user to select multiple ingredients from a specific list.
3.  **Dosage:** Based on their chosen ingredients, suggest a dosage range using a slider.
4.  **Formula Name:** Ask the user to name their custom formula using a text input.
5.  **Completion:** After gathering all information, provide a summary message and signal that the process is complete.

**RESPONSE FORMAT:**
You MUST respond with a single, valid JSON object. Do not include any text outside of the JSON object. The JSON object must have the following structure:
{
  "text": "Your conversational question or message to the user.",
  "inputType": "options" | "multiselect" | "slider" | "text" | null,
  "component": "Format" | "Ingredients" | "Dosage" | "FormulaName" | null,
  "options": ["An", "array", "of", "strings"] | null,
  "sliderConfig": { "min": number, "max": number, "step": number, "defaultValue": number, "unit": "string", "recommendedValue": number } | null,
  "isComplete": boolean
}

**DETAILED WORKFLOW & RULES:**

*   **Initial Call (empty history):**
    *   Start with the 'Format' question.
    *   \`text\`: "Great choice! Let's start with the format. What would you like?"
    *   \`inputType\`: "options"
    *   \`component\`: "Format"
    *   \`options\`: ["Stick Pack", "Capsule", "Pod"]
    *   \`isComplete\`: false

*   **After 'Format' is answered:**
    *   Ask the 'Ingredients' question.
    *   \`text\`: "Awesome! Now, let's pick the key ingredients for your blend. You can select multiple."
    *   \`inputType\`: "multiselect"
    *   \`component\`: "Ingredients"
    *   \`options\`: ["Caffeine Anhydrous", "L-Theanine", "Guarana Extract", "L-Tyrosine", "Vitamin B3", "Vitamin B5", "Vitamin B12", "Piperine", "Green Tea Extract", "Alpha-GPC", "Rhodiola Rosea", "Huperzine A", "Citicoline", "Vitamin B6", "Lion's Mane", "Bacopa", "Kanna", "Ashwagandha", "Magnesium Glycinate", "Lemon Balm", "GABA", "Holy Basil", "5-HTP", "Capsaicin", "Grains of Paradise", "Ginger Root Extract", "Forskolin", "Berberine", "L-Carnitine", "L-Citrulline Malate", "Beta-Alanine", "Creatine Monohydrate", "Beet Root Powder", "Coconut Water Powder", "Sodium", "Potassium", "Magnesium", "BCAAs", "Vitamin C", "Zinc", "Vitamin D3", "Reishi Mushroom", "Elderberry", "Quercetin", "Astragalus Root", "Olive Leaf Extract", "Hyaluronic Acid", "D-Ribose", "Inulin"]
    *   \`isComplete\`: false

*   **After 'Ingredients' are answered:**
    *   Ask the 'Dosage' question.
    *   Analyze the user's selected ingredients from the conversation history to suggest an appropriate dosage range. For example, if they select stimulants like Caffeine, suggest a range like 50-400mg. If they select calming ingredients like Ashwagandha, suggest a higher range like 300-600mg.
    *   \`text\`: "Excellent choices! Based on your ingredients, what dosage range are you aiming for?"
    *   \`inputType\`: "slider"
    *   \`component\`: "Dosage"
    *   \`sliderConfig\`: Create a relevant config based on their ingredients.
    *   \`isComplete\`: false

*   **After 'Dosage' is answered:**
    *   Ask the 'Formula Name' question.
    *   \`text\`: "Perfect! We're almost done. What would you like to name your custom formula?"
    *   \`inputType\`: "text"
    *   \`component\`: "FormulaName"
    *   \`isComplete\`: false

*   **After 'Formula Name' is answered:**
    *   Provide the completion message.
    *   \`text\`: "Fantastic! Your custom blend is ready. Click the 'Proceed' button below to review and purchase."
    *   \`inputType\`: null
    *   \`component\`: null
    *   \`isComplete\`: true
`;

// Helper to format conversation history for OpenAI
const formatHistory = (history: Message[], formula: Formula): { role: 'user' | 'assistant' | 'system'; content: string }[] => {
    const formatted: { role: 'user' | 'assistant' | 'system'; content: string }[] = [{
        role: 'system',
        content: systemInstruction
    }];
    
    // Add a summary of what has been collected so far
    if(Object.keys(formula).length > 0) {
        formatted.push({
            role: 'system',
            content: `Current formula details collected so far: ${JSON.stringify(formula)}`
        });
    }

    history.forEach(msg => {
        if(msg.sender === 'bot' && msg.id === 'start') return; // Don't include the static start message
        formatted.push({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        });
    });

    return formatted;
};


export const getNextStep = async (apiKey: string, history: Message[], formula: Formula): Promise<Message | null> => {
    if (!apiKey) {
        console.error("OpenAI API key is missing.");
        return {
            id: 'error',
            sender: 'bot',
            text: 'API Key is not configured.'
        };
    }
    
    const messages = formatHistory(history, formula);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: messages,
                response_format: { type: "json_object" },
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API Error:', errorData);
            return {
                id: 'error',
                sender: 'bot',
                text: `Sorry, there was an error with the AI service: ${errorData.error.message}`
            };
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
             return { id: 'error', sender: 'bot', text: 'Sorry, I received an empty response.' };
        }

        // The response is expected to be a valid JSON string
        const parsedContent = JSON.parse(content);

        return {
            id: Date.now().toString(),
            sender: 'bot',
            text: parsedContent.text || "I'm not sure what to say next!",
            inputType: parsedContent.inputType,
            component: parsedContent.component,
            options: parsedContent.options,
            sliderConfig: parsedContent.sliderConfig,
            isComplete: parsedContent.isComplete,
        };

    } catch (error) {
        console.error('Error calling OpenAI Service:', error);
        return {
            id: 'error',
            sender: 'bot',
            text: 'I am having trouble connecting. Please check your connection and try again.'
        };
    }
};