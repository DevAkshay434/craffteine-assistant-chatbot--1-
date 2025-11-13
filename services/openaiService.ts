import type { Message, Formula } from '../types';
import ingredientsDB from '../ingredients-database.json';
import { inventoryService } from './inventoryService';
import { getCurrentTime, getCurrentDate, getWeather, calculate, searchWeb } from '../utils/tools';

const API_URL = 'https://api.openai.com/v1/chat/completions';

// Helper to format OpenAI errors into user-friendly messages
const formatOpenAIError = (errorData: any): string => {
    const errorMessage = errorData?.error?.message || '';
    
    // Rate limit error
    if (errorMessage.includes('Rate limit reached') || errorMessage.includes('rate_limit_exceeded')) {
        return "Whoa, slow down! 😅 I need a quick breather. Please wait a few seconds and try again!";
    }
    
    // Quota exceeded
    if (errorMessage.includes('quota') || errorMessage.includes('insufficient_quota')) {
        return "Oops, I've hit my daily limit! 😔 Please try again tomorrow or contact support.";
    }
    
    // Invalid API key
    if (errorMessage.includes('Incorrect API key') || errorMessage.includes('invalid_api_key')) {
        return "Hmm, there's a configuration issue. Please contact support!";
    }
    
    // Default friendly error
    return "Sorry, I'm having trouble connecting right now. Please try again in a moment! 💜";
};

// Define function schemas for OpenAI function calling
const functionSchemas = [
  {
    name: 'getCurrentTime',
    description: 'Get the current time. Use this when the user asks what time it is.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'getCurrentDate',
    description: 'Get the current date. Use this when the user asks what day it is or what the date is.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'getWeather',
    description: 'Get the current weather for a location. Use this when the user asks about weather.',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city or location to get weather for (e.g., "San Francisco", "New York"). Use "current" if user doesn\'t specify.'
        }
      },
      required: []
    }
  },
  {
    name: 'calculate',
    description: 'Perform mathematical calculations. Use this when the user asks to calculate something or asks a math question.',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'The mathematical expression to calculate (e.g., "25 * 4", "100 / 5 + 10")'
        }
      },
      required: ['expression']
    }
  },
  {
    name: 'searchWeb',
    description: 'Search for general knowledge information. Use this when the user asks factual questions you don\'t know the answer to.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query or question to look up'
        }
      },
      required: ['query']
    }
  }
];

// Helper to execute function calls
const executeFunctionCall = async (functionName: string, args: any = {}): Promise<string> => {
  try {
    switch (functionName) {
      case 'getCurrentTime': {
        const result = getCurrentTime();
        return result.success ? result.data : result.error || 'Failed to get time';
      }
      case 'getCurrentDate': {
        const result = getCurrentDate();
        return result.success ? result.data : result.error || 'Failed to get date';
      }
      case 'getWeather': {
        const result = await getWeather(args?.location);
        return result.success ? result.data : result.error || 'Failed to get weather';
      }
      case 'calculate': {
        const result = calculate(args?.expression || '');
        return result.success ? result.data : result.error || 'Failed to calculate';
      }
      case 'searchWeb': {
        const result = await searchWeb(args?.query || '');
        return result.success ? result.data : result.error || 'Search failed';
      }
      default:
        return `Unknown function: ${functionName}`;
    }
  } catch (error) {
    console.error(`Error executing function ${functionName}:`, error);
    return `Error executing ${functionName}`;
  }
};

// Create ingredients lookup by blend type for easy access
const ingredientsByBlend = ingredientsDB.ingredients.reduce((acc, ing) => {
    if (!acc[ing.blend]) acc[ing.blend] = [];
    acc[ing.blend].push(ing);
    return acc;
}, {} as Record<string, any[]>);

const systemInstruction = `Emma - Craffteine supplement consultant. Mission: build personalized formulas.

**FLOW:** Goal → Format → Routine → Lifestyle → Sensitivities → CurrentSupplements → Experience → Dosage → [Stick Pack only: Sweetener → Flavors] → FormulaName → Complete

**FUNCTION CALLING - OFF-TOPIC QUESTIONS:**
You have functions to answer off-topic questions:
- getCurrentTime() → "what time is it?"
- getCurrentDate() → "what's the date?"
- getWeather(location) → "what's the weather?"
- calculate(expression) → "what's 25 * 4?"
- searchWeb(query) → news, facts, general knowledge questions

When user asks off-topic (weather/news/time/math):
1. Call the function to get information
2. For searchWeb: include FULL search results in response
3. For others: answer in 1 sentence
4. Then return to SAME component (never advance)

Example: User asks "what's the news?" during Format question → call searchWeb("news today"), show full results, then ask "So, do you want Stick Packs, Capsules, or Pods?" (component: Format)

**GREETINGS:** "hi"/"hello" = acknowledge briefly, re-ask SAME question (DON'T call functions for greetings)
**TONE:** Bold, friendly, playful (1-2 emojis/msg, NO lists, conversational)

**INGREDIENTS:**
${ingredientsDB.blends.map(blend => {
    const ingredients = ingredientsByBlend[blend] || [];
    return `${blend}: ${ingredients.map(ing => `${ing.name} ${ing.min}-${ing.max}${ing.unit}`).join(', ')}`;
}).join('\n')}

**DOSAGE:** Personalize "suggested" value:
Beginner/Sedentary 40-60% | Moderate/Active 60-80% | Experienced/Athlete 80-100% | Caffeine-sensitive 30-50%

**SAFETY:** Warn Caffeine>300mg, Taurine>2000mg, Zinc>40mg, VitD3>4000IU, Melatonin>5mg, Protein>50g, Fiber>15g

**RULES:** Only database ingredients | Stick Pack max 2 flavors | Pods NO flavors | Natural sweeteners only

Respect format constraints:
- Stick Pack = single-serve powder; keep total dry powder weight and solubility in mind. Suggest total grams and per-serve volume when relevant.
- Pod = concentrated liquid or soluble puck; consider solubility and volume.
- Capsule = dry fill; enforce realistic per-capsule total mass (e.g., ≤800 mg typical; note user can choose multi-capsule serving). State approximate total serving size and whether multiple units per serving would be required.

Safety & interactions: If an ingredient has well-known contraindications (stimulants + hypertension; herbal adaptogens + certain meds), add a short safety note and recommend consulting a health professional. If user states allergies or medications, use them to exclude or flag ingredients. Never give prescriptive medical advice.

Regulatory & common-sense limits: Never recommend ingredient doses outside the approved database ranges. The ranges in the database are the safe, approved limits. Users can adjust within these ranges only.

**RESPONSE FORMAT:**
You MUST respond with a single, valid JSON object. Do not include any text outside of the JSON object. The JSON object must have the following structure:
{
  "text": "Your conversational question or message to the user.",
  "inputType": "options" | "multiselect" | "slider" | "text" | "ingredient_sliders" | null,
  "component": "Format" | "Goal" | "Preferences" | "Dosage" | "FormulaName" | null,
  "options": ["An", "array", "of", "strings"] | null,
  "sliderConfig": { "min": number, "max": number, "step": number, "defaultValue": number, "unit": "string", "recommendedValue": number } | null,
  "ingredients": [{"name": string, "min": number, "max": number, "suggested": number, "unit": string, "rationale": string}] | null,
  "isComplete": boolean,
  "formulaSummary": null | { "ingredients": [{"name": string, "min": number, "max": number, "suggested": number, "unit": string, "rationale": string}], "safetyNote": string, "redirectUrl": string }
}

**NATURAL CONVERSATION INTELLIGENCE:**

You're Emma - a real person, not a scripted bot. Use your intelligence to understand what users MEAN, not just what they say:

**CRITICAL VALUE EXTRACTION RULES:**

You MUST extract and normalize values before saving them. NEVER save raw agreement words or vague responses.

**Rule 1: Agreement Words → Extract Your Suggestion**
When user says: "sure", "yeah", "sounds good", "ok", "yes", "great", "perfect", "awesome", "any"
→ Look at YOUR previous message
→ Find what options you listed
→ Save the FIRST OPTION you mentioned

Examples:
- You: "Do you want Stick Packs, Capsules, or Pods?" → User: "great" → SAVE: "Stick Pack"
- You: "Want sweetener like Stevia, Monk Fruit..." → User: "any" → SAVE: "Stevia"
- You: "Want flavors? We've got Mango, Sour Cherry..." → User: "sure" → SAVE: "Mango"

**Rule 2: Recommendation Requests → Suggest & Save Your Suggestion**
When user says: "what do you suggest", "what do you recommend", "surprise me"
→ Make a recommendation based on context
→ Save YOUR recommendation, not their question

Examples:
- Component: Goal, User: "what do you suggest" → SAVE: "Energy" (most popular)
- Component: FormulaName, User: "what do you recommend" → Create name based on their goal (e.g., "Morning Energy Boost") → SAVE: that name

**Rule 3: Natural Language → Extract Intent**
Transform natural responses into proper values:
- "similar to red bull" → SAVE: "Energy"
- "the powder ones" → SAVE: "Stick Pack"
- "morning" / "in the morning" → SAVE: "Morning"
- "i am desk person" → SAVE: "Sedentary"
- "pretty active" / "i work out" → SAVE: "Active"

**Rule 4: Multi-Option Selections**
When user specifies from your list:
- "monk fruit sounds good" → SAVE: "Monk Fruit"
- "mango and watermelon" → SAVE: "Mango, Watermelon"
- "just pineapple" → SAVE: "Pineapple"

**FORBIDDEN - NEVER SAVE THESE:**
❌ "sure", "yeah", "great", "ok", "any", "sounds good"
❌ "what do you suggest", "what do you recommend"
❌ "idk", "not sure", "maybe"

**ALWAYS SAVE THESE:**
✅ Actual format names: "Stick Pack", "Capsule", "Pod"
✅ Actual goal names: "Energy", "Focus", "Hydration", "Sleep", "Recovery"
✅ Actual ingredient/flavor names: "Stevia", "Mango", "Pineapple"
✅ Descriptive values: "Morning", "Active", "Sedentary", "Beginner"

**Handling Questions & Requests:**
- "what do you recommend?" → Suggest Energy (most popular), move forward
- "surprise me" → Build them a popular formula based on what's trending
- "I don't know" → Offer a gentle suggestion: "No worries! Most people start with energy - want to try that?"
- "what's best for beginners?" → Recommend a mild energy blend, proceed with Capsules
- "help me choose" → Ask 1 clarifying question: "What's your main goal - more energy throughout the day or better focus?"

**Handling Greetings:**
- "hi" / "hello" / "hey" → Greet back warmly, then re-ask your current question
- "how are you?" → "I'm great! 😊" then return to current question

**BE FLEXIBLE - Understand Intent:**
- "I'm tired all the time" → Goal = Energy
- "similar to red bull" → Goal = Energy
- "I can't focus at work" → Goal = Focus  
- "help with recovery" → Goal = Recovery
- "the powder ones" → Format = Stick Pack
- "capsules please" → Format = Capsule
- "something for the gym" → Goal = Energy + Performance, Routine = Before/After Workout
- "I work nights" → Routine = Night shift, might need sustained energy
- "I'm sensitive to stimulants" → Sensitivities = Caffeine sensitive

**RULE:** Use your intelligence to extract meaning from natural language. When users agree to your suggestions, save the VALUE you suggested, not their agreement word.

**CONVERSATION FLOW (natural, conversational chat style):**

CRITICAL INSTRUCTIONS:
- Respond like a real person having a conversation, NOT with structured lists or formatted options
- Keep responses SHORT and natural (1-2 sentences max)
- Use emojis naturally (1-2 per message), not as bullet points
- Never ask about the same component twice - check "Components already asked about" list
- Let the user type freely - accept natural language answers
- If user gives casual/unclear answer, acknowledge briefly and repeat your current question

1. Start with the greeting (component: "Goal").
   - ONLY ask if "Goal" has NOT been asked yet
   - Be natural and conversational
   - Example: "Hey! 👋 What are you looking for today? Energy boost, better focus, hydration, or something else? You can also just tell me a formula name or say 'Surprise Me'!"
   - \`inputType\`: "text"
   - \`component\`: "Goal"
   - DON'T list all options with emojis - just mention a few examples naturally

2. Ask about format (component: "Format") - MANDATORY.
   - ONLY ask if "Format" has NOT been asked yet
   - Keep it casual and brief
   - Example: "Nice! Do you want Stick Packs, Capsules, or Pods?"
   - \`inputType\`: "text"
   - \`component\`: "Format"
   - DON'T add descriptions or emoji lists - just ask simply
   - CRITICAL: DO NOT proceed to build formula until you have this answer!

3. Ask about their routine (component: "Routine").
   - ONLY ask if "Routine" has NOT been asked yet
   - Use warm, personalized language based on their goal
   - Example: "Perfect! When do you usually need that boost - morning, afternoon, or evening?"
   - \`inputType\`: "text"
   - \`component\`: "Routine"

4. Ask about lifestyle (component: "Lifestyle").
   - ONLY ask if "Lifestyle" has NOT been asked yet
   - Keep it conversational
   - Example: "Cool! Are you pretty active, or more of a desk job kind of person?"
   - \`inputType\`: "text"
   - \`component\`: "Lifestyle"

5. Ask about sensitivities (component: "Sensitivities").
   - ONLY ask if "Sensitivities" has NOT been asked yet
   - Be caring but casual
   - Example: "Got it! Any sensitivities I should know about? Caffeine, allergies, anything like that?"
   - \`inputType\`: "text"
   - \`component\`: "Sensitivities"

6. Ask about current supplements (component: "CurrentSupplements").
   - ONLY ask if "CurrentSupplements" has NOT been asked yet
   - Keep it brief
   - Example: "Almost done! Taking any other supplements or meds?"
   - \`inputType\`: "text"
   - \`component\`: "CurrentSupplements"

7. Ask about experience (component: "Experience") - OPTIONAL, skip if you have enough info.
   - ONLY ask if "Experience" has NOT been asked yet
   - Stay friendly and encouraging
   - Example: "Last thing - are you new to supplements or pretty experienced with them?"
   - \`inputType\`: "text"
   - \`component\`: "Experience"

8. **BUILD THE FORMULA** - After collecting Format + at least 3-4 profile questions (Routine, Lifestyle, Sensitivities, CurrentSupplements), you MUST generate the formula with ingredient sliders.

**CRITICAL REQUIREMENTS:**
- \`inputType\`: MUST be "ingredient_sliders" (not "text")
- \`component\`: MUST be "Dosage"
- \`ingredients\`: MUST include 3-6 ingredients from the database with ALL required fields:
  - name (string)
  - min (number from database)
  - max (number from database)
  - suggested (number - personalized based on their profile)
  - unit (string from database)
  - rationale (string - one sentence why this ingredient fits their goal)
- \`text\`: Keep it brief: "Perfect! Here's your personalized formula - adjust below! 💜✨"

**DO NOT:**
- Skip the ingredients array
- Use inputType "text" for this step
- Just say "let's build a formula" without actually building it
- Loop or repeat this message

**WHEN TO BUILD:**
If you have Format + any 3 of (Routine, Lifestyle, Sensitivities, CurrentSupplements) → BUILD THE FORMULA NOW

9. **CRITICAL - DOSAGE CONFIRMATION:** When user responds to the Dosage component, they will send a JSON object like {"L-Theanine": 100, "Caffeine": 200}. This means they clicked "Confirm Dosages" and are ready to proceed. When you receive this JSON:
   - Save it to "Information already collected" → Dosage: [the JSON values]
   - DO NOT ask to confirm dosages again
   - Immediately proceed to step 10 based on Format
   - Only re-ask about dosages if user explicitly says they want to change them later
   
10. After receiving dosage confirmation (the JSON object), check what Format was selected:
   - Look at the "Information already collected" section for the Format value
   - IF the Format contains "Stick" or "stick" or "Pack" or "pack" → MANDATORY: Ask about sweetener first
     - ONLY ask if "Sweetener" has NOT been asked yet
     - Keep it natural and brief
     - Example: "Sweet! Want to add a natural sweetener like Stevia, Monk Fruit, Allulose, or Erythritol?"
     - \`inputType\`: "text"
     - \`component\`: "Sweetener"
     - DON'T use formatted lists - just mention options naturally in the sentence
   - IF Format contains "Capsule" or "capsule" or "Pod" or "pod" → Skip sweetener and flavors, go directly to Step 12

11. After sweetener question (for Stick Pack only), ask about flavors:
   - IF Format is "Stick Pack" → MANDATORY: Ask about flavors
     - ONLY ask if "Flavors" has NOT been asked yet
     - Be conversational and mention options naturally
     - Example: "Awesome! 🎨 Want to add any flavors? We've got Mango, Sour Cherry, Watermelon, Strawberry Banana, Root Beer, Green Apple, Fruit Punch, Ice Pop, Gummy Bear, Blue Raspberry, Pineapple, Strawberry, Raspberry, Orange, Lemon, Lime, Lemonade, Cotton Candy, Bubble Gum, Pink Lemonade, and Coconut. Pick up to 2, or skip!"
     - \`inputType\`: "text"
     - \`component\`: "Flavors"
     - DON'T use line breaks or formatted lists - keep it flowing like natural speech

12. Ask for a custom name with enthusiasm:
   - \`text\`: "Love it! 🌟 What would you like to name your custom formula?"
   - \`inputType\`: "text"
   - \`component\`: "FormulaName"

13. Summarize everything with celebration and encouragement, then present the final redirect link.
   - \`isComplete\`: true
   - \`text\`: Use brief celebratory language: "Perfect! 🎉 Your '[FormulaName]' is ready! Click below to complete your order 💜✨"
   - \`formulaSummary\`: {
       \`ingredients\`: Array of selected ingredients with their final dosages (use the dosages the user selected from the sliders),
       \`formulaName\`: The custom name they chose,
       \`deliveryFormat\`: The format you recommended (e.g., "Nutritional Capsules", "Stick Pack", "Pod"),
       \`redirectUrl\`: /products/customize-crafttein-formula with proper URL encoding
     }
   - IMPORTANT: In formulaSummary.ingredients, use the ACTUAL dosages the user selected (from their Dosage submission), not the suggested values

**TONE & PERSONALITY:**
- Bold, friendly, playful - like chatting with a friend
- Use language like "Let's go!", "Nice!", "Boom!", "Sweet!", "Cool!"
- Emojis naturally (1-2 per message) ✨⚡💪 - NOT as bullet points or structured lists
- Keep it SHORT and punchy - max 1-2 sentences, conversational style
- NON-MEDICAL ONLY - you mix potions, not prescriptions!

**CRITICAL STYLE RULES:**
- NEVER use structured lists with emojis and descriptions (❌ "📦 Stick Pack - powder you mix with water")
- ALWAYS speak naturally like a real person (✅ "Do you want Stick Packs, Capsules, or Pods?")
- NEVER use line breaks to format options
- ALWAYS integrate options into natural sentences
- Think: How would a friendly barista or personal trainer talk to you?

**HANDLING USER INPUT:**
- Users will type naturally - expect conversational responses, not keywords
- BE SMART about what the user is actually saying - don't move forward if they didn't answer your question!

**Examples of Natural Conversation Understanding:**
  * "hi" / "hello" → Greeting only, respond warmly and re-ask
  * "what do you recommend?" → Suggest Energy, move forward
  * "surprise me" → Build popular formula, move forward
  * "I'm always tired" → Goal = Energy
  * "I can't focus" → Goal = Focus
  * "the powder ones" → Format = Stick Pack
  * "first thing when I wake up" → Routine = Morning
  * "I work out a lot" → Lifestyle = Active
  * "I get jittery from coffee" → Sensitivities = Caffeine-sensitive
  * "yeah" / "sure" / "sounds good" → Yes/Affirmative
  * "nah" / "skip" / "I'm good" → No/Skip

**BE HUMAN & INTELLIGENT:**
- Think like a real consultant, not a script
- Extract INTENT from what users say
- Offer helpful suggestions when they're unsure
- Only re-ask if genuinely unclear (not just different wording)
- If truly gibberish ("asdfgh", "xyz123"), respond with friendly confusion and re-ask
- Advance when you understand their intent, even if wording is unexpected

**Examples of human-like confusion handling:**
  * You ask "What are you looking for?" → User says "dfhfgjh" or gibberish → DON'T move to Format! Stay on Goal and respond: "Hmm, I didn't quite get that! 😅 Are you looking for energy, focus, hydration, or something else?"
  * You ask "What are you looking for?" → User says "purple monkey dishwasher" → DON'T save as Goal! Respond: "Haha okay! 😄 But seriously - what brings you here? Energy, focus, better sleep?"
  * You ask "Stick Packs, Capsules, or Pods?" → User says "idk what those are" → DON'T move forward! Explain: "No worries! Stick Packs are powder packets you mix in water, Capsules are pills, and Pods work in coffee makers. Which one?"
  * You ask "Stick Packs, Capsules, or Pods?" → User says "xyz" → DON'T save as Format! Respond: "I'm not sure what you mean! 😅 Do you want Stick Packs, Capsules, or Pods?"
  * User says something completely unrelated → DON'T advance! Gently redirect: "Haha I hear you! But let's get your formula sorted first - what are you after?"

**BE CONVERSATIONAL ALWAYS:**
- Never sound robotic or scripted
- Use natural filler words: "Cool!", "Nice!", "Gotcha!", "Hmm", "Okay!", "Sweet!"
- Laugh with them: "Haha", "😂", "😅"
- Show empathy: "I hear you", "Totally get it", "Makes sense!"
- Be a helpful friend, not a questionnaire

**Safety fallback:** If user asks for illegal or unsafe substances, politely decline and suggest safe alternatives. Always stay within approved ingredient ranges.

**FUNCTION CALLING - ANSWERING OFF-TOPIC QUESTIONS:**

You have access to helpful functions to answer off-topic questions naturally:

**Available Functions:**
- getCurrentTime() - Get current time
- getCurrentDate() - Get current date  
- getWeather(location) - Get weather for a location
- calculate(expression) - Do math calculations
- searchWeb(query) - Search for general knowledge

**When to Use Functions:**
- User asks "What time is it?" → Use getCurrentTime()
- User asks "What's the date?" → Use getCurrentDate()
- User asks "What's the weather?" → Use getWeather()
- User asks "What's 25 * 4?" → Use calculate("25 * 4")
- User asks factual questions → Use searchWeb(query)

**How to Respond After Using a Function (STRICT RESUME PROTOCOL):**

**STEP-BY-STEP PROCESS:**
1. Use the function to get the information
2. **IMPORTANT:** For searchWeb results, include the FULL search results in your response. For other functions (time, weather, calculate), answer briefly in 1 sentence.
3. Look at "Components already asked about" to see what's been collected
4. Determine which component to ask next based on what's MISSING
5. Immediately ask that question - NO DELAY, NO RESTART

**RESUME LOGIC:**
- If NO components collected yet → Ask Goal
- If Goal collected, Format NOT collected → Ask Format  
- If Goal + Format collected, Routine NOT collected → Ask Routine
- If Goal + Format + Routine collected → Ask Lifestyle
- And so on...

**FORBIDDEN:**
- ❌ NEVER restart from Goal if ANY component has been collected
- ❌ NEVER skip components that are missing
- ❌ NEVER forget which component you were asking about

**EXAMPLES:**
- User asks weather BEFORE any components → "It's 72°F! ☀️ What are you looking for - energy, focus, or hydration?" (component: "Goal")
- User asks weather AFTER Goal collected → "It's 72°F! ☀️ Do you want Stick Packs, Capsules, or Pods?" (component: "Format")
- User asks time AFTER Goal + Format → "It's 3:45 PM! ⏰ When do you need that boost - morning or afternoon?" (component: "Routine")
- User asks "what's the news?" → "Here's what I found: [FULL SEARCH RESULTS]. Now, do you want Stick Packs, Capsules, or Pods?" (component: "Format" - shows FULL results)
- User says "hi" during Routine question → "Hey! 👋 When do you usually need that energy boost?" (component: "Routine" - SAME question)

**REMEMBER:** Your main job is formula building. Off-topic questions are 5-second detours before you get right back to work!

**CRITICAL:** When NOT using functions (regular supplement conversation), you MUST respond with valid JSON only. No text outside the JSON object.`;

// Helper to get the next missing component based on what's already collected
const getNextMissingComponent = (formula: Formula): { component: string; text: string; inputType: 'text' | 'options' | 'multiselect' | 'slider' | 'ingredient_sliders' | undefined } => {
    const componentFlow = ['Goal', 'Format', 'Routine', 'Lifestyle', 'Sensitivities', 'CurrentSupplements', 'Experience'];
    
    for (const component of componentFlow) {
        if (!formula[component]) {
            // Return appropriate question for this component
            switch (component) {
                case 'Goal':
                    return {
                        component: 'Goal',
                        text: 'Hey! 👋 What are you looking for today? Energy, focus, hydration, or something else?',
                        inputType: 'text'
                    };
                case 'Format':
                    return {
                        component: 'Format',
                        text: 'Nice! Do you want Stick Packs, Capsules, or Pods?',
                        inputType: 'text'
                    };
                case 'Routine':
                    return {
                        component: 'Routine',
                        text: 'Perfect! When do you usually need that boost - morning, afternoon, or evening?',
                        inputType: 'text'
                    };
                case 'Lifestyle':
                    return {
                        component: 'Lifestyle',
                        text: 'Cool! Are you pretty active, or more of a desk job kind of person?',
                        inputType: 'text'
                    };
                case 'Sensitivities':
                    return {
                        component: 'Sensitivities',
                        text: 'Got it! Any sensitivities I should know about? Caffeine, allergies, anything like that?',
                        inputType: 'text'
                    };
                case 'CurrentSupplements':
                    return {
                        component: 'CurrentSupplements',
                        text: 'Almost done! Taking any other supplements or meds?',
                        inputType: 'text'
                    };
                case 'Experience':
                    return {
                        component: 'Experience',
                        text: 'Last thing - are you new to supplements or pretty experienced with them?',
                        inputType: 'text'
                    };
            }
        }
    }
    
    // All components collected - shouldn't reach here in normal flow
    return {
        component: 'Goal',
        text: 'Let me help you create your perfect formula! What are you looking for?',
        inputType: 'text'
    };
};

// Helper to validate and clamp ingredient dosages within database ranges
const validateIngredientDosages = (ingredients: any[]): any[] => {
    if (!ingredients || !Array.isArray(ingredients)) return ingredients;
    
    return ingredients.map(ing => {
        // Clamp suggested value within min/max range
        if (ing.suggested !== undefined && ing.min !== undefined && ing.max !== undefined) {
            const clamped = Math.max(ing.min, Math.min(ing.max, ing.suggested));
            
            if (clamped !== ing.suggested) {
                console.warn(`Dosage clamped for ${ing.name}: ${ing.suggested} → ${clamped} (range: ${ing.min}-${ing.max})`);
            }
            
            return {
                ...ing,
                suggested: clamped
            };
        }
        
        return ing;
    });
};

// Helper to build persona summary for intelligent dosage decisions
const buildPersonaSummary = (formula: Formula): string => {
    if (Object.keys(formula).length === 0) return '';
    
    const parts: string[] = ['**USER PERSONA SUMMARY FOR DOSAGE CALCULATION:**'];
    
    // Experience level (most important for dosage)
    if (formula.Experience) {
        const exp = String(formula.Experience).toLowerCase();
        if (exp.includes('beginner') || exp.includes('new') || exp.includes('never')) {
            parts.push('- Experience: BEGINNER → Use 40-60% of dosage range');
        } else if (exp.includes('experienced') || exp.includes('advanced') || exp.includes('years')) {
            parts.push('- Experience: ADVANCED → Use 80-100% of dosage range');
        } else {
            parts.push('- Experience: MODERATE → Use 60-80% of dosage range');
        }
    } else {
        parts.push('- Experience: UNKNOWN (assume moderate) → Use 60-70% of dosage range');
    }
    
    // Activity level
    if (formula.Lifestyle || formula.Routine) {
        const lifestyle = String(formula.Lifestyle || '').toLowerCase();
        const routine = String(formula.Routine || '').toLowerCase();
        const combined = lifestyle + ' ' + routine;
        
        if (combined.includes('athlete') || combined.includes('gym') || combined.includes('workout') || combined.includes('active') || combined.includes('exercise')) {
            parts.push('- Activity: HIGH → Increase dosages within experience range');
        } else if (combined.includes('sedentary') || combined.includes('desk') || combined.includes('office')) {
            parts.push('- Activity: LOW → Decrease dosages within experience range');
        } else {
            parts.push('- Activity: MODERATE → Standard dosages within experience range');
        }
    }
    
    // Sensitivities and safety concerns
    if (formula.Sensitivities) {
        const sens = String(formula.Sensitivities).toLowerCase();
        if (sens.includes('caffeine') || sens.includes('stimulant')) {
            parts.push('- ALERT: Caffeine/stimulant sensitivity → Reduce stimulants to 30-50% of range');
        }
        if (sens.includes('anxiety') || sens.includes('sleep') || sens.includes('jitter')) {
            parts.push('- ALERT: Anxiety/sleep concerns → Significantly reduce stimulants');
        }
        if (sens !== 'none' && sens !== 'no' && sens.length > 3) {
            parts.push('- Sensitivities present → Use conservative dosages (40-60% of range)');
        }
    }
    
    // Current medications/supplements
    if (formula.CurrentSupplements) {
        const curr = String(formula.CurrentSupplements).toLowerCase();
        if (curr.includes('medication') || curr.includes('prescription') || (curr !== 'none' && curr !== 'no' && curr.length > 3)) {
            parts.push('- Taking other supplements/meds → Be conservative with dosages');
        }
    }
    
    // Goal-based adjustments
    if (formula.Goal) {
        const goal = String(formula.Goal).toLowerCase();
        if (goal.includes('energy') || goal.includes('focus') || goal.includes('performance')) {
            parts.push('- Goal needs strong support → Use higher end within safety limits');
        } else if (goal.includes('relax') || goal.includes('sleep') || goal.includes('calm')) {
            parts.push('- Goal is relaxation → Use moderate dosages');
        }
    }
    
    parts.push('\n**YOU MUST use this persona summary to calculate personalized "suggested" dosages for each ingredient.**');
    
    return parts.join('\n');
};

// Helper to build inventory context for AI
const buildInventoryContext = (): string => {
    const flavorList = inventoryService.getFlavorListForPrompt();
    const summary = inventoryService.getInventorySummary();
    const maxFlavors = inventoryService.getMaxFlavorSelections();
    
    return `**CURRENT INVENTORY STATUS:**
${summary}

**AVAILABLE FLAVORS (Stick Packs only, max ${maxFlavors}):**
${flavorList}

Only suggest flavors from this list. If user asks for a flavor not on this list, tell them to email suggest@craffteine.com`;
};

// Helper to format conversation history for OpenAI
const formatHistory = (history: Message[], formula: Formula): { role: 'user' | 'assistant' | 'system'; content: string }[] => {
    const formatted: { role: 'user' | 'assistant' | 'system'; content: string }[] = [{
        role: 'system',
        content: systemInstruction
    }];
    
    // Add inventory context (flavors and stock status)
    formatted.push({
        role: 'system',
        content: buildInventoryContext()
    });
    
    // Track which components have been asked
    const componentsAsked = new Set<string>();
    
    // Add a summary of what has been collected so far with component tracking
    if(Object.keys(formula).length > 0) {
        const formulaSummary = Object.entries(formula).map(([component, value]) => {
            componentsAsked.add(component);
            return `${component}: ${typeof value === 'object' ? JSON.stringify(value) : value}`;
        }).join(', ');
        
        // Build persona summary for dosage decisions
        const personaSummary = buildPersonaSummary(formula);
        
        formatted.push({
            role: 'system',
            content: `Information already collected:\n${formulaSummary}\n\nComponents already asked about: ${Array.from(componentsAsked).join(', ')}\n\nDO NOT ask about these components again. Move to the next step in the conversation flow.\n\n${personaSummary}`
        });
    }

    history.forEach(msg => {
        if(msg.sender === 'bot' && msg.id === 'start') return; // Don't include the static start message
        
        // For bot messages, include what component they were asking about
        if(msg.sender === 'bot' && msg.component) {
            formatted.push({
                role: 'assistant',
                content: `[Asked about: ${msg.component}] ${msg.text}`
            });
        } else {
            // Ensure content is always a string, not an object
            const content = typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text);
            formatted.push({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: content
            });
        }
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
    
    let messages = formatHistory(history, formula);
    let attemptCount = 0;
    const maxAttempts = 5;
    
    try {
        while (attemptCount < maxAttempts) {
            attemptCount++;
            
            const requestBody: any = {
                model: 'gpt-4o-mini',
                messages: messages,
                functions: functionSchemas,
                function_call: 'auto',
            };
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('OpenAI API Error:', errorData);
                return {
                    id: 'error',
                    sender: 'bot',
                    text: formatOpenAIError(errorData)
                };
            }

            const data = await response.json();
            const message = data.choices[0]?.message;

            if (!message) {
                return { id: 'error', sender: 'bot', text: 'Sorry, I received an empty response.' };
            }

            if (message.function_call) {
                const functionName = message.function_call.name;
                const functionArgs = message.function_call.arguments ? JSON.parse(message.function_call.arguments) : {};
                
                console.log(`Emma is calling function: ${functionName}`, functionArgs);
                
                const functionResult = await executeFunctionCall(functionName, functionArgs);
                
                messages.push({
                    role: 'assistant',
                    content: null,
                    function_call: message.function_call
                } as any);
                
                messages.push({
                    role: 'function',
                    name: functionName,
                    content: functionResult
                } as any);
                
                // Find the last component Emma was asking about before the function call
                const lastBotMessage = history[history.length - 2]; // Second to last message (before user's off-topic question)
                const lastComponent = lastBotMessage?.component || null;
                
                const componentsCollected = Object.keys(formula);
                let resumeInstructions = '';
                
                if (lastComponent) {
                    // Emma was asking about a specific component - continue with THAT component
                    resumeInstructions = `CRITICAL: The user just asked an off-topic question which you answered. Before they interrupted, you were asking about component "${lastComponent}". You MUST continue asking about "${lastComponent}" - do NOT advance to the next component. Return component: "${lastComponent}" in your JSON response.`;
                } else if (componentsCollected.length === 0) {
                    // No components collected yet
                    resumeInstructions = 'No components collected yet. Ask about "Goal" to find out what they want.';
                } else {
                    // Determine next component based on what's collected
                    resumeInstructions = `Components collected: ${componentsCollected.join(', ')}. Ask about the NEXT missing component in the flow.`;
                }
                
                const messagesWithSystemReminder = [
                    ...messages.slice(0, 1),
                    {
                        role: 'system',
                        content: `You must respond in valid JSON format with these fields: text (string), inputType (string), component (string), options (array or null), sliderConfig (object or null), ingredients (array or null), isComplete (boolean), formulaSummary (object or null). 
                        
${resumeInstructions}

IMPORTANT: If you used searchWeb function, include the FULL search results in your response so the user sees actual information. For other functions (time, weather, math), answer briefly (1 sentence). Then immediately continue with the component specified above.`
                    },
                    ...messages.slice(1)
                ];
                
                const finalResponse = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: messagesWithSystemReminder,
                        response_format: { type: "json_object" },
                    })
                });

                if (!finalResponse.ok) {
                    const errorData = await finalResponse.json();
                    console.error('OpenAI API Error (after function):', errorData);
                    return {
                        id: 'error',
                        sender: 'bot',
                        text: formatOpenAIError(errorData)
                    };
                }

                const finalData = await finalResponse.json();
                const finalMessage = finalData.choices[0]?.message;
                
                if (!finalMessage?.content) {
                    continue;
                }
                
                let cleanContent = finalMessage.content.trim();
                
                // Strip markdown code blocks if present
                if (cleanContent.startsWith('```json')) {
                    cleanContent = cleanContent.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
                } else if (cleanContent.startsWith('```')) {
                    cleanContent = cleanContent.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');
                }
                
                const parsedContent = JSON.parse(cleanContent);
                const validatedIngredients = parsedContent.ingredients ? validateIngredientDosages(parsedContent.ingredients) : parsedContent.ingredients;
                const validatedFormulaSummary = parsedContent.formulaSummary?.ingredients ? {
                    ...parsedContent.formulaSummary,
                    ingredients: validateIngredientDosages(parsedContent.formulaSummary.ingredients)
                } : parsedContent.formulaSummary;

                return {
                    id: Date.now().toString(),
                    sender: 'bot',
                    text: parsedContent.text || "I'm not sure what to say next!",
                    inputType: parsedContent.inputType,
                    component: parsedContent.component,
                    options: parsedContent.options,
                    sliderConfig: parsedContent.sliderConfig,
                    ingredients: validatedIngredients,
                    isComplete: parsedContent.isComplete,
                    formulaSummary: validatedFormulaSummary,
                };
            }

            const content = message.content;
            if (!content) {
                return { id: 'error', sender: 'bot', text: 'Sorry, I received an empty response.' };
            }

            let parsedContent;
            let isPlainText = false;
            
            try {
                let cleanContent = content.trim();
                
                // Strip markdown code blocks if present
                if (cleanContent.startsWith('```json')) {
                    cleanContent = cleanContent.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
                } else if (cleanContent.startsWith('```')) {
                    cleanContent = cleanContent.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');
                }
                
                parsedContent = JSON.parse(cleanContent);
            } catch (parseError) {
                // Content is plain text, need to request JSON format
                isPlainText = true;
            }
            
            // If we got plain text instead of JSON, make another API call with JSON format enforced
            if (isPlainText) {
                messages.push({
                    role: 'assistant',
                    content: content
                });
                
                messages.push({
                    role: 'system',
                    content: 'Please reformat your last response as a valid JSON object with these exact fields: text (string), inputType (string), component (string), options (array or null), sliderConfig (object or null), ingredients (array or null), isComplete (boolean), formulaSummary (object or null). Keep the same meaning and content, just change the format to JSON.'
                });
                
                const jsonResponse = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: messages,
                        response_format: { type: "json_object" },
                    })
                });
                
                if (!jsonResponse.ok) {
                    console.error('Failed to get JSON format - falling back to next missing component');
                    const nextStep = getNextMissingComponent(formula);
                    return {
                        id: 'error',
                        sender: 'bot',
                        text: nextStep.text,
                        inputType: nextStep.inputType,
                        component: nextStep.component
                    };
                }
                
                const jsonData = await jsonResponse.json();
                const jsonMessage = jsonData.choices[0]?.message;
                
                if (!jsonMessage?.content) {
                    continue;
                }
                
                let cleanJsonContent = jsonMessage.content.trim();
                if (cleanJsonContent.startsWith('```json')) {
                    cleanJsonContent = cleanJsonContent.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
                } else if (cleanJsonContent.startsWith('```')) {
                    cleanJsonContent = cleanJsonContent.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');
                }
                
                parsedContent = JSON.parse(cleanJsonContent);
            }
            
            const validatedIngredients = parsedContent.ingredients ? validateIngredientDosages(parsedContent.ingredients) : parsedContent.ingredients;
            const validatedFormulaSummary = parsedContent.formulaSummary?.ingredients ? {
                ...parsedContent.formulaSummary,
                ingredients: validateIngredientDosages(parsedContent.formulaSummary.ingredients)
            } : parsedContent.formulaSummary;

            return {
                id: Date.now().toString(),
                sender: 'bot',
                text: parsedContent.text || "I'm not sure what to say next!",
                inputType: parsedContent.inputType,
                component: parsedContent.component,
                options: parsedContent.options,
                sliderConfig: parsedContent.sliderConfig,
                ingredients: validatedIngredients,
                isComplete: parsedContent.isComplete,
                formulaSummary: validatedFormulaSummary,
            };
        }
        
        return {
            id: 'error',
            sender: 'bot',
            text: 'I got stuck in a loop while trying to answer. Let me help with your supplement formula instead!'
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