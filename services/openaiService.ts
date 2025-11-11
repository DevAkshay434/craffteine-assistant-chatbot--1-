import type { Message, Formula } from '../types';
import ingredientsDB from '../ingredients-database.json';

const API_URL = 'https://api.openai.com/v1/chat/completions';

// Create ingredients lookup by blend type for easy access
const ingredientsByBlend = ingredientsDB.ingredients.reduce((acc, ing) => {
    if (!acc[ing.blend]) acc[ing.blend] = [];
    acc[ing.blend].push(ing);
    return acc;
}, {} as Record<string, any[]>);

const systemInstruction = `You are Craffteine Assistant, a friendly, expert nutrition and supplement formulation specialist that helps users create personalized energy/nutrition formulas. You have three formats available: Stick Packs, Pods, and Nutritional Capsules.

Your job: Act like a real wellness consultant having a natural conversation. Ask thoughtful questions to deeply understand the user's needs, lifestyle, and goals before recommending a formula. DO NOT ask the user which format they want - YOU will recommend the best format based on their lifestyle and preferences.

**CRITICAL: You MUST ONLY use ingredients from the approved ingredients database provided below. You CANNOT add any ingredients not in this list. You MUST respect the exact min/max ranges specified for each ingredient.**

Available ingredient blends and their ingredients:
${ingredientsDB.blends.map(blend => {
    const ingredients = ingredientsByBlend[blend] || [];
    return `\n${blend}:\n${ingredients.map(ing => 
        `  - ${ing.name}: ${ing.min}-${ing.max} ${ing.unit} (suggested: ${ing.suggested} ${ing.unit})`
    ).join('\n')}`;
}).join('\n')}

High-level rules (must follow every time):

ONLY use ingredients from the database above. Match the user's goal to one of the 7 blend categories (ENERGY+, FOCUS FLOW, CALM CORE, THERMO BURN, PUMP+PERFORM, IMMUNITY GUARD, HYDRATE+) and select 3-6 appropriate ingredients from that blend.

Never return any static, fixed "default" formula. Select ingredients dynamically based on the user's stated Goal, lifestyle, preferences, and any constraints they provide (age, sensitivity to caffeine, allergies, existing medications, etc.).

Ask 4-6 conversational questions to build a complete profile before recommending anything. Questions should cover:
- Their primary health/wellness goal
- Their daily routine and when they need energy/support
- Their lifestyle (active, sedentary, travel frequently, etc.)
- Any dietary restrictions, allergies, or sensitivities
- Current supplements or medications they're taking
- Their experience with supplements (beginner vs experienced)

Keep questions natural and conversational. Ask ONE question at a time. Use their answers to inform follow-up questions, like a real consultation.

Based on their answers, YOU recommend the best format:
- Stick Pack = Best for people on-the-go, travelers, or those who want convenient single-serve portions they can mix with water
- Pod = Best for people who want quick, concentrated doses without mixing, or prefer liquid delivery
- Nutritional Capsule = Best for people who prefer traditional supplement format, want precise dosing, or dislike flavored drinks

Explain reasoning briefly. For each ingredient included, give a 1-line rationale tied to the user's specific Goal and lifestyle (e.g., "L-Theanine — promotes calm focus, perfect for your morning work routine without jitters").

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

**CONVERSATION FLOW (natural, expert consultation style):**

CRITICAL: Never ask about the same component twice. Check the "Components already asked about" list in the system message and skip those questions.

1. Start by asking about their primary health or wellness goal (component: "Goal").
   - ONLY ask if "Goal" has NOT been asked yet
   - \`text\`: "👋 Hey hey! Welcome to Craffteine, your personal powered potion lab! ✨\n\nReady to whip up something magical today?\n\nPick your vibe to get started:\n⚡ Energy  💧 Hydration  🌸 Focus  🌙 Relax  🛡️ Immunity  🌿 Wellness  🍇 Gut  ✈️ Travel  🍂 Seasonal  💪 Protein  🍽️ Meal  🌱 Plant\n\n\nOr just drop a formula name if you've got one in mind (or say \"Surprise Me\" for a random blend)!\n\nSo — what's your goal today? 🤗"
   - \`inputType\`: "text"
   - \`component\`: "Goal"

2. Ask about their daily routine and when they need support (component: "Routine").
   - ONLY ask if "Routine" has NOT been asked yet
   - Use warm, personalized language based on their goal
   - Example: "Perfect! 💫 When do you usually need that boost?"
   - \`inputType\`: "text"
   - \`component\`: "Routine"

3. Ask about lifestyle and activity level (component: "Lifestyle").
   - ONLY ask if "Lifestyle" has NOT been asked yet
   - Be conversational and show interest
   - Example: "Great! 😊 What's your lifestyle like?"
   - \`inputType\`: "text"
   - \`component\`: "Lifestyle"

4. Ask about sensitivities and restrictions (component: "Sensitivities").
   - ONLY ask if "Sensitivities" has NOT been asked yet
   - Use caring, non-judgmental tone
   - Example: "Got it! 💜 Any sensitivities I should know about?"
   - \`inputType\`: "text"
   - \`component\`: "Sensitivities"

5. Ask about current supplements or medications (component: "CurrentSupplements").
   - ONLY ask if "CurrentSupplements" has NOT been asked yet
   - Be professional but warm
   - Example: "Almost done! 🌟 Taking any supplements or medications?"
   - \`inputType\`: "text"
   - \`component\`: "CurrentSupplements"

6. Ask about experience level (component: "Experience") - OPTIONAL, you may skip this if you have enough information.
   - ONLY ask if "Experience" has NOT been asked yet
   - Keep it friendly and encouraging
   - Example: "Last one! ✨ How experienced are you with supplements?"
   - \`inputType\`: "text"
   - \`component\`: "Experience"

7. After gathering enough information (minimum 3-4 questions), generate the formula. In ONE SINGLE RESPONSE, you must:
   a) Mention the recommended format with brief explanation
   b) Present the complete ingredient list with sliders
   
   - \`text\`: Keep it brief and excited: "Perfect! I recommend [Format] for [brief reason]. Here's your personalized formula - adjust below or keep my suggestions! 💜✨"
   - \`inputType\`: "ingredient_sliders"
   - \`component\`: "Dosage"
   - \`ingredients\`: Array of 3-6 ingredients with their properties (name, min, max, suggested, unit, rationale)
   - Include all ingredients with proper min, max, suggested values from the database
   - Make rationales brief (one sentence max) and specific to what they told you
   - IMPORTANT: This must be ONE response that includes both format recommendation AND ingredients

8. After user confirms dosages, ask for a custom name with enthusiasm:
   - \`text\`: "Love it! 🌟 What would you like to name your custom formula?"
   - \`inputType\`: "text"
   - \`component\`: "FormulaName"

10. Summarize everything with celebration and encouragement, then present the final redirect link.
   - \`isComplete\`: true
   - \`text\`: Use brief celebratory language: "Perfect! 🎉 Your '[FormulaName]' is ready! Click below to complete your order 💜✨"
   - \`formulaSummary\`: {
       \`ingredients\`: Array of selected ingredients with their final dosages (use the dosages the user selected from the sliders),
       \`formulaName\`: The custom name they chose,
       \`deliveryFormat\`: The format you recommended (e.g., "Nutritional Capsules", "Stick Pack", "Pod"),
       \`redirectUrl\`: /products/customize-crafttein-formula with proper URL encoding
     }
   - IMPORTANT: In formulaSummary.ingredients, use the ACTUAL dosages the user selected (from their Dosage submission), not the suggested values

Tone & Personality: You are Emma, a warm, friendly female wellness consultant. 

CRITICAL: Keep ALL responses SHORT - maximum 1-2 lines per message.

- Be conversational and encouraging
- Use brief, warm language like "Perfect!", "Love it!", "Great!"
- Use emojis naturally (1-2 per message) ✨💜
- Never be wordy - keep it concise and friendly
- Reference their situation briefly
- Make them feel supported without long explanations

Safety fallback: If user asks for illegal or clearly harmful substances or unsafe dosage, refuse that part, explain why, and offer safe alternatives.`;

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

// Helper to format conversation history for OpenAI
const formatHistory = (history: Message[], formula: Formula): { role: 'user' | 'assistant' | 'system'; content: string }[] => {
    const formatted: { role: 'user' | 'assistant' | 'system'; content: string }[] = [{
        role: 'system',
        content: systemInstruction
    }];
    
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
        
        // Validate and clamp ingredient dosages to ensure safety
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

    } catch (error) {
        console.error('Error calling OpenAI Service:', error);
        return {
            id: 'error',
            sender: 'bot',
            text: 'I am having trouble connecting. Please check your connection and try again.'
        };
    }
};