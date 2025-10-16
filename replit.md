# Craffteine Assistant Chatbot

## Overview

The Craffteine Assistant is an AI-powered chatbot for creating personalized energy supplement blends. It guides users through a structured conversation to configure their custom formula by selecting format, ingredients, dosage, and naming their blend. The application is built as a standalone React app that can be embedded into a Shopify store, providing an interactive product configurator experience.

**Current Status:** Successfully configured and running on Replit with OpenAI integration.

## Recent Changes (October 16, 2025)

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
- `VITE_OPENAI_API_KEY`: OpenAI API key for AI-powered conversation (configured in Replit Secrets)

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
Structured 4-step guided workflow:
1. Format selection (single choice)
2. Ingredients selection (multi-select)
3. Dosage configuration (slider with intelligent defaults)
4. Formula naming (text input)

Each step is component-driven with specific input types defined in the Message interface.

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
- Currently uses environment variable (`VITE_OPENAI_API_KEY`)
- Note in code indicates this should move to backend for production
- API calls made directly from browser (security concern noted in comments)

**Conversation Context:**
- Maintains full message history for contextual responses
- Formula state passed to API for ingredient-aware dosage recommendations
- Response parsing includes error handling for malformed JSON

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