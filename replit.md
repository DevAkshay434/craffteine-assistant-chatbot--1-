# Craffteine Assistant Chatbot

## Overview

The Craffteine Assistant is an AI-powered chatbot for creating personalized energy supplement blends. It guides users through a structured conversation to configure their custom formula by selecting format, ingredients, dosage, and naming their blend. The application is built as a standalone React app that can be embedded into a Shopify store, providing an interactive product configurator experience.

**Current Status:** Successfully configured and running on Replit with OpenAI integration.

## Recent Changes

### November 11, 2025 - Conversation Flow Fix
- **Fixed conversation flow**: Restructured system instruction to enforce proper question sequence
- **Format question mandatory**: Emma now asks about Format (Stick Pack, Capsule, Pod) as Step 2, right after Goal
- **Profile questions before dosages**: Emma gathers Routine, Lifestyle, Sensitivities, CurrentSupplements, and Experience before showing formula
- **Removed conflicting flows**: Eliminated duplicate/contradictory flow instructions that caused Emma to skip questions
- **Sequential steps**: Flow now follows 11 clear steps: Goal → Format → Routine → Lifestyle → Sensitivities → CurrentSupplements → Experience → Build Formula → Flavors (Stick Pack only) → Formula Name → Finalize
- **Flavor integration**: Flavors asked at Step 9 (after dosages, only for Stick Pack format)

### November 11, 2025 - Excel Stock List Integration
- **Automated Excel import**: Created `scripts/import-stock.cjs` to convert Excel files to JSON format
- **Flavor inventory**: Generated `data/flavors.json` with 22 flavors including categories, status, and format availability
- **Powder inventory**: Generated `data/powders.json` with 505 water-soluble powder ingredients and status
- **Inventory service**: Built `services/inventoryService.ts` to manage flavor/powder stock data with helper methods
- **AI inventory context**: Integrated inventory service with OpenAI - Emma now receives real-time flavor availability (22 flavors) in every conversation
- **Format-specific filtering**: Flavors automatically filtered for Stick Packs only (max 2 selections), with Capsules and Pods skipping flavors entirely
- **Dynamic prompt injection**: `buildInventoryContext()` function adds inventory summary and available flavors list as system message
- **Stock validation ready**: Infrastructure in place for post-response validation of AI-suggested flavors against current inventory
- **Data structure**: JSON files include lastUpdated timestamp and count for future refresh automation
- **Efficient prompt management**: 505 powders kept out of prompt (only summary count included) to manage token usage

### November 11, 2025 - Intelligent Dosage Personalization System
- **Smart dosage scaling**: OpenAI now calculates personalized ingredient dosages based on user profile instead of always suggesting maximum values
- **Persona analysis**: System analyzes user's experience level (beginner/moderate/advanced), activity level, sensitivities, medications, and goals
- **Dosage rubric**: Beginner users get 40-60% of range, moderate 60-80%, advanced 80-100%, with safety overrides for sensitivities
- **Multi-factor considerations**: Dosages adjusted based on caffeine sensitivity, anxiety/sleep issues, current medications, and stated goals
- **Safety validation**: Added `validateIngredientDosages` function that clamps all AI-recommended dosages within database min/max ranges
- **Persona summary**: `buildPersonaSummary` function creates detailed user profile for AI to reference when calculating dosages
- **Example scenarios**: Beginner+sedentary gets ~75mg caffeine (40%), experienced+athlete gets ~170mg (85%), caffeine-sensitive gets ~65mg (35%)
- **OpenAI API key setup**: User's own OpenAI API key configured in Replit Secrets as `OPENAI_API_KEY`

### November 4, 2025 - Intelligent Formula Creation System
- **Upgraded to dynamic AI formula generation**: Replaced static question flow with intelligent consultant-style interaction
- **New system prompt**: AI now acts as an expert product formulator creating custom formulas based on user goals
- **Enhanced conversation flow**: Natural, adaptive questioning based on Format, Goal, Preferences, and user constraints
- **Dynamic ingredient selection**: AI recommends 3-6 ingredients with dosage ranges based on user's stated goal and format
- **Safety features**: AI validates dosages, flags contraindications, and provides safety notes
- **Formula summary display**: Beautiful UI showing ingredients with rationales, dosage ranges, and safety notes
- **URL generation**: AI creates properly encoded redirect URLs to Shopify product page
- **Type system updates**: Added `FormulaSummary` and `Ingredient` types for structured formula data
- **Fixed API key issue**: Resolved OpenAI API key loading by clearing Vite cache and restarting server
- **Installed react-markdown**: Added for future rich text formatting support

### October 16, 2025 - Initial Setup
- Fixed TypeScript configuration by adding `vite-env.d.ts` for environment variable types
- Configured Vite with `allowedHosts: true` to support Replit's dynamic proxy hostnames
- Created missing `index.css` file for base styles
- Installed all required npm dependencies
- Set up development workflow on port 5000
- Configured autoscale deployment with build and preview commands

## User Preferences

Preferred communication style: Simple, everyday language.

## Replit Environment Setup

**Required Environment Variables:**
- `OPENAI_API_KEY`: User's own OpenAI API key for AI-powered conversation (configured in Replit Secrets)

**Development:**
- Development server runs on port 5000 (host: 0.0.0.0)
- Uses Vite with HMR configured for Replit's proxy environment
- `allowedHosts: true` configured to work with Replit's dynamic hostnames
- HMR WebSocket errors in browser console are expected and don't affect functionality

**Deployment:**
- Configured for autoscale deployment
- Build command: `npm run build`
- Run command: `npx vite preview --host 0.0.0.0`
- Preview server also configured with `allowedHosts: true`

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Tailwind CSS (via CDN) for styling
- React Markdown for message rendering

**Component Structure:**
The application follows a modular component architecture with clear separation of concerns:

- **App.tsx**: Root component managing global state (messages, formula data, typing indicators)
- **ChatWindow**: Container for the chat interface and interactive elements
- **ChatMessage**: Renders individual text messages with bot/user styling
- **Interactive Components**: Specialized input components for different interaction types:
  - `OptionButton`: Single-choice selection
  - `MultiSelectOptions`: Multiple-choice selection with checkboxes
  - `RangeSlider`: Dosage selection with configurable ranges
  - `InlineTextInput`: Text input for formula naming
- **UI Components**: `ChatBubble` (toggles chat window), `TypingIndicator` (loading states)
- **Icon Components**: SVG icons for bot, user, chat, close, and sparkles

**State Management:**
- Uses React hooks (useState, useEffect, useRef) for local state management
- `conversationHistoryRef` maintains chat history for API context
- Formula object tracks user selections across the multi-step flow
- No external state management library - keeps it simple with lifted state

**Conversation Flow:**
Intelligent, adaptive workflow:
1. Format selection (Stick Pack, Pod, or Nutritional Capsule)
2. Goal inquiry (e.g., boost focus, sustained energy, recovery, sleep support)
3. Preferences/constraints (optional - caffeine sensitivity, allergies, age, etc.)
4. AI generates dynamic formula with 3-6 ingredients based on goal and format
5. Formula presentation with ingredients, rationales, dosage ranges, and safety notes
6. Optional dosage adjustment (if user wants to customize)
7. Formula naming (text input)
8. Final summary with redirect URL to Shopify customization page

Each step is component-driven with specific input types defined in the Message interface. The AI adapts the conversation based on user responses and only asks necessary questions.

### API Integration

**OpenAI Integration:**
- Uses GPT models via OpenAI Chat Completions API
- System instruction defines the entire conversation flow and response format
- API expects structured JSON responses containing:
  - Conversational text
  - Input type (options/multiselect/slider/text)
  - Component identifier
  - Configuration data (options array, slider config)
  - Completion flag

**API Key Management:**
- Uses environment variable (`OPENAI_API_KEY`) from Replit Secrets
- User's own OpenAI API key, billed directly to their OpenAI account
- Note in code indicates this should move to backend for production
- API calls made directly from browser (security concern noted in comments)

**Conversation Context:**
- Maintains full message history for contextual responses
- Formula state passed to API for ingredient-aware dosage recommendations
- Persona summary generated from user responses (experience, activity, sensitivities, goals) for intelligent dosage calculation
- Response parsing includes error handling for malformed JSON
- Dosage validation ensures all AI-recommended values stay within safe database ranges

### External Dependencies

**Third-Party Services:**
1. **OpenAI API** (Primary AI Service)
   - Endpoint: `https://api.openai.com/v1/chat/completions`
   - Purpose: Conversational AI for guided product configuration
   - Authentication: API key in headers
   - Response format: Structured JSON with UI directives

2. **Shopify Integration** (Mock Implementation)
   - Service exists (`shopifyService.ts`) but uses mock data
   - Designed to fetch customer orders for "modify order" flow
   - Real implementation requires backend proxy due to CORS and security
   - Mock data includes order ID, name, date, and formula details

3. **Google AI Studio** (Mentioned but Not Active)
   - References in README to Gemini API
   - Unused `geminiService.ts` file exists
   - Application currently uses OpenAI instead

**Build & Development Tools:**
- Vite 5.2.0 for bundling and hot module replacement
- TypeScript 5.2.2 for type checking
- React plugin for Vite (`@vitejs/plugin-react`)
- Configured for host 0.0.0.0:5000 with HMR on port 443

**CDN Resources:**
- Tailwind CSS loaded from CDN
- Import maps reference AI Studio CDN for some dependencies
- React/React-DOM can be loaded via CDN or npm (dual setup)

**Deployment Context:**
- Designed to run both standalone and as Shopify theme extension
- Extension files exist in `extensions/craffteine-chatbot/` (currently empty)
- Assets can be compiled to `assets/` subdirectory for clean distribution

**Notable Architectural Decisions:**

1. **Client-side AI calls**: API key exposed in browser environment - documented as needing backend migration for production
2. **Mock Shopify data**: Real Shopify integration requires backend proxy to avoid CORS and token exposure
3. **Structured AI responses**: AI returns JSON with UI directives rather than pure text, enabling dynamic interface generation
4. **Component-driven inputs**: Each input type has dedicated component for consistent UX
5. **Conversation state preservation**: useRef maintains history without triggering re-renders