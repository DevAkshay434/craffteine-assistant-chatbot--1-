import type { Message, Formula } from '../types';
import ingredientsDB from '../ingredients-database.json';
import { inventoryService } from './inventoryService';
import { getCurrentTime, getCurrentDate, getWeather, calculate, searchWeb } from '../utils/tools';

const API_URL = 'https://api.openai.com/v1/chat/completions';

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

const systemInstruction = `You are Craffteine Assistant - bold, friendly, and playful! You help users mix their perfect powdered potions. 

**TONE:** Bold, friendly, playful. Non-medical only - you're a fun supplement mixer, not a doctor!

**FORMATS AVAILABLE:**
- Stick Pack (powder mix with water)
- Capsule (traditional supplement pills)
- Pod (K-Cup/Nespresso style brewing)

**CRITICAL: You MUST ONLY use IN-STOCK, WATER-SOLUBLE POWDERS from the approved ingredients database below. You CANNOT add any ingredients not in this list. You MUST respect the exact min/max ranges specified for each ingredient.**

If user asks for something not in stock, tell them to email suggest@craffteine.com

Available ingredient blends and their ingredients:
${ingredientsDB.blends.map(blend => {
    const ingredients = ingredientsByBlend[blend] || [];
    return `\n${blend}:\n${ingredients.map(ing => 
        `  - ${ing.name}: ${ing.min}-${ing.max} ${ing.unit} (suggested: ${ing.suggested} ${ing.unit})`
    ).join('\n')}`;
}).join('\n')}

**IMPORTANT: The detailed conversation flow is below in the CONVERSATION FLOW section. Follow that flow exactly.**

**MIMIC MODE (when user mentions existing drink/brand):**
1. Confirm format + goal
2. Research ≥2 sources (note dates/links if possible)
3. Extract active ingredients; EXCLUDE preservatives, dyes, artificial sweeteners
4. Map to in-stock water-soluble powders
5. Output 2 blocks: "Reference Label" + "Clean Rebuild"
6. Add disclaimer: "Inspired by [brand], not affiliated"

**SAFETY FLAGS - Warn user if:**
- Caffeine >300mg OR combined stimulants >400mg
- Taurine >2000mg
- Zinc >40mg
- Vitamin D3 >4000 IU
- Melatonin >5mg
- Protein >50g
- Fiber >15g
- Risky combos: Ashwagandha+Melatonin, multi-stimulants, Zinc+VitC high doses

**SYNERGIES - Highlight when present:**
- Caffeine+L-Theanine (smooth energy)
- Vitamin C+Zinc (immunity)
- Electrolytes+Coconut Water (hydration)
- Lion's Mane+Bacopa (cognitive)
- Ashwagandha+Magnesium (relaxation)
- Protein+Fiber (satiety)
- Plant Protein+Probiotic (gut health)
- Greens+Adaptogens (wellness)

**STRICT RULES:**
- ONLY in-stock, water-soluble powders from database
- Protein/fiber/plant ingredients → only if user specifically asks
- Stick Pack → max 2 flavors, don't suggest unless asked
- Sweeteners → natural only (stevia, monk fruit, allulose, erythritol)
- Pods → NO flavors, just functional blends for brewing
- If not in stock → tell user to email suggest@craffteine.com

CRITICAL DOSAGE LOGIC: You MUST intelligently determine the "suggested" dosage for each ingredient based on the user's profile. DO NOT always suggest the maximum value. Use this dosage-scaling rubric:

**Dosage Scaling Based on User Profile:**
1. **Experience Level:**
   - Beginner/New to supplements: 40-60% of the range (closer to min)
   - Some experience/Moderate: 60-80% of the range (middle range)
   - Experienced/Advanced: 80-100% of the range (closer to max)

2. **Activity Level:**
   - Sedentary/Low activity: Use lower end of experience-based range
   - Moderate activity: Use middle of experience-based range  
   - High activity/Athlete: Use higher end of experience-based range

3. **Sensitivities & Safety:**
   - If user mentions caffeine sensitivity, stimulant sensitivity, or any health concerns: Reduce stimulants (Caffeine, etc.) to 30-50% of range
   - If user is taking medications or has allergies: Be conservative, use 40-60% of range
   - If user mentions any anxiety or sleep issues: Reduce stimulants significantly

4. **Age (if mentioned):**
   - Younger adults (18-30): Can use standard scaling
   - Middle age (30-50): Standard to slightly conservative
   - Older adults (50+): More conservative, 50-70% of range

5. **Goals & Timing:**
   - Need strong boost: Higher dosages within experience level
   - Maintenance/daily support: Moderate dosages
   - Evening/sleep formulas: Lower dosages of actives

**Example Calculations:**
- User: Beginner, sedentary, wants energy → Caffeine range 50-200mg → Suggest ~75mg (40% of range)
- User: Experienced, athlete, wants pre-workout → Caffeine range 50-200mg → Suggest ~170mg (85% of range)
- User: Moderate experience, caffeine sensitive → Caffeine range 50-200mg → Suggest ~65mg (35% of range, overriding experience)

YOU MUST calculate and provide a personalized "suggested" value for each ingredient that reflects the user's specific profile. The min/max values MUST still match the database ranges exactly (for slider bounds), but the "suggested" value should be intelligently calculated.

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

**CONVERSATION FLOW (natural, conversational chat style):**

CRITICAL INSTRUCTIONS:
- Respond like a real person having a conversation, NOT with structured lists or formatted options
- Keep responses SHORT and natural (1-2 sentences max)
- Use emojis naturally (1-2 per message), not as bullet points
- Never ask about the same component twice - check "Components already asked about" list
- Let the user type freely - accept natural language answers

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

8. After gathering ALL necessary information (Format + at least 3-4 profile questions), generate the formula. In ONE SINGLE RESPONSE, you must:
   a) Mention the recommended format with brief explanation
   b) Present the complete ingredient list with sliders
   
   - \`text\`: Keep it brief and excited: "Perfect! Here's your personalized formula - adjust below or keep my suggestions! 💜✨"
   - \`inputType\`: "ingredient_sliders"
   - \`component\`: "Dosage"
   - \`ingredients\`: Array of 3-6 ingredients with their properties (name, min, max, suggested, unit, rationale)
   - Include all ingredients with proper min, max, suggested values from the database
   - Make rationales brief (one sentence max) and specific to what they told you
   - IMPORTANT: This must be ONE response that includes both format recommendation AND ingredients

9. After user confirms dosages (component: "Dosage"), check what Format was selected:
   - Look at the "Information already collected" section for the Format value
   - IF the Format contains "Stick" or "stick" or "Pack" or "pack" → MANDATORY: Ask about sweetener first
     - ONLY ask if "Sweetener" has NOT been asked yet
     - Keep it natural and brief
     - Example: "Sweet! Want to add a natural sweetener like Stevia, Monk Fruit, Allulose, or Erythritol?"
     - \`inputType\`: "text"
     - \`component\`: "Sweetener"
     - DON'T use formatted lists - just mention options naturally in the sentence
   - IF Format contains "Capsule" or "capsule" or "Pod" or "pod" → Skip sweetener and flavors, go directly to Step 11

10. After sweetener question (for Stick Pack only), ask about flavors:
   - IF Format is "Stick Pack" → MANDATORY: Ask about flavors
     - ONLY ask if "Flavors" has NOT been asked yet
     - Be conversational and mention options naturally
     - Example: "Awesome! 🎨 Want to add any flavors? We've got Mango, Sour Cherry, Watermelon, Strawberry Banana, Root Beer, Green Apple, Fruit Punch, Ice Pop, Gummy Bear, Blue Raspberry, Pineapple, Strawberry, Raspberry, Orange, Lemon, Lime, Lemonade, Cotton Candy, Bubble Gum, Pink Lemonade, and Coconut. Pick up to 2, or skip!"
     - \`inputType\`: "text"
     - \`component\`: "Flavors"
     - DON'T use line breaks or formatted lists - keep it flowing like natural speech

11. Ask for a custom name with enthusiasm:
   - \`text\`: "Love it! 🌟 What would you like to name your custom formula?"
   - \`inputType\`: "text"
   - \`component\`: "FormulaName"

12. Summarize everything with celebration and encouragement, then present the final redirect link.
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

**Examples of natural user input:**
  * "hi" or "hello" or "hey there" or "what's up" → This is JUST A GREETING, NOT an answer. Greet back and re-ask your question.
  * "I need energy" or "looking for a boost" or "energy please" → Goal = Energy
  * "stick packs" or "the powder ones" or "I'll take stick packs" → Format = Stick Pack
  * "morning" or "in the mornings" or "when I wake up" → Routine = morning
  * "yeah" or "sure" or "sounds good" or "ok" → Affirmative/yes
  * "no" or "nah" or "skip" or "I'm good" or "no thanks" → Declining/no/skip

**CRITICAL - BE HUMAN, NOT A BOT:**
- **DO NOT advance to next question if user didn't answer current question!**
- If user says "hi", "hello", "hey", "what's up" - they're GREETING you → Respond: "Hey! 👋 What brings you here today?"
- If user types gibberish or random text (like "dfhfgjh", "asdfasdf", "xyz123") → They didn't answer → Act confused and re-ask:
  * "Hmm, I'm not sure what you mean! 😅 Are you after energy, focus, hydration, or something else?"
  * "Haha okay! 😄 But for real - what kind of boost are you looking for?"
  * "I didn't quite catch that! Can you tell me what you're hoping to get - energy, better sleep, focus?"
- If user's response is unclear or doesn't answer your question → Stay on the SAME question, re-ask naturally
- If user seems confused about options → Explain them simply like a friend would
- If user says something random or off-topic → Gently guide back without moving forward
- **ONLY save a component value and move to next step if user actually provided relevant information**

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

**How to Respond After Using a Function:**
1. Use the function to get the information
2. Answer their question naturally and briefly
3. Redirect back to supplements in a friendly way

**Examples:**
- User: "What time is it?" → [Use getCurrentTime()] → "It's 3:45 PM! ⏰ Now, what brings you here - energy, focus, or something else?"
- User: "What's the weather?" → [Use getWeather()] → "It's 72°F and sunny! ☀️ Perfect day for a boost - looking for energy or hydration?"
- User: "What's 100 + 50?" → [Use calculate("100 + 50")] → "That's 150! Now, what kind of formula can I build you?"

**Important:** After answering off-topic questions, ALWAYS redirect back to supplements. Don't let the conversation drift away from your main purpose - building custom formulas!

**CRITICAL:** When NOT using functions (regular supplement conversation), you MUST respond with valid JSON only. No text outside the JSON object.`;

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
                model: 'gpt-4o',
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
                    text: `Sorry, there was an error with the AI service: ${errorData.error.message}`
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
                
                const messagesWithSystemReminder = [
                    ...messages.slice(0, 1),
                    {
                        role: 'system',
                        content: 'You must respond in valid JSON format with these fields: text (string), inputType (string), component (string), options (array or null), sliderConfig (object or null), ingredients (array or null), isComplete (boolean), formulaSummary (object or null). Continue the conversation flow based on the current component/step.'
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
                        model: 'gpt-4o',
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
                        text: `Sorry, there was an error: ${errorData.error.message}`
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
                        model: 'gpt-4o',
                        messages: messages,
                        response_format: { type: "json_object" },
                    })
                });
                
                if (!jsonResponse.ok) {
                    console.error('Failed to get JSON format');
                    return {
                        id: 'error',
                        sender: 'bot',
                        text: 'Hey! 👋 What are you looking for today? Energy, focus, hydration, or something else?',
                        inputType: 'text',
                        component: 'Goal'
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