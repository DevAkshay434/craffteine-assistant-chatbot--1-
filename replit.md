# Craffteine Assistant Chatbot

## Overview

The Craffteine Assistant is an AI-powered chatbot designed to guide users in creating personalized energy supplement blends. It facilitates a structured conversation to configure custom formulas by selecting format, ingredients, dosage, and blend naming. The application functions as a standalone React app embeddable into a Shopify store, serving as an interactive product configurator. The project aims to provide a seamless and intelligent user experience for custom supplement creation, leveraging AI for dynamic formula generation and dosage personalization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18 and TypeScript, using Vite for development and bundling. Styling is handled by Tailwind CSS (via CDN). The application employs a modular component structure with clear separation of concerns for `App.tsx`, `ChatWindow`, `ChatMessage`, and various interactive components like `OptionButton`, `MultiSelectOptions`, `RangeSlider`, and `InlineTextInput`. State management primarily uses React hooks (`useState`, `useEffect`, `useRef`) for local state, with `conversationHistoryRef` maintaining chat history for API context.

### Backend Architecture

A lightweight Express.js backend server (`server.js`) runs on port 3001 to securely proxy API requests. This backend handles web search requests to the Brave Search API, preventing API key exposure on the client side and avoiding CORS issues. The backend uses environment variables from `.env` for secure API key storage.

### Conversation Flow

The chatbot implements an intelligent, adaptive conversation flow that guides users through specific steps:
1.  **Goal**: User's primary objective (e.g., focus, energy).
2.  **Format**: Choice between Stick Pack, Capsule, or Pod.
3.  **Routine, Lifestyle, Sensitivities, CurrentSupplements, Experience**: Detailed user profiling for personalization.
4.  **Formula Building**: AI generates 3-6 ingredients with dosage ranges based on goals and format.
5.  **Sweetener/Flavors**: (For Stick Pack only) Selection of natural sweeteners and flavors.
6.  **Formula Naming**: User provides a name for their blend.
7.  **Finalization**: Summary and redirect URL to Shopify.

The AI dynamically adjusts questions and recommendations based on user input, ensuring a personalized experience. Emma, the AI, acts as a helpful conversational guide, avoiding structured lists and maintaining a natural, human-like interaction style with natural language processing for flexible input parsing and confusion handling. Emma maintains conversation context and can handle casual interruptions (greetings, small talk) while remembering where in the formula-building flow she was, ensuring users don't lose progress.

### AI and Personalization

The system leverages OpenAI's GPT models for dynamic formula generation and intelligent dosage personalization. It analyzes user profiles (experience, activity, sensitivities, medications, goals) to suggest ingredient dosages, applying a dosage rubric (e.g., beginner users receive 40-60% of the range). Safety validation clamps AI-recommended dosages within predefined min/max ranges. The system also integrates function calling to answer off-topic questions (e.g., time, date, weather, calculations, web search) before redirecting back to supplement configuration.

### Data Management

Inventory data for flavors and powders is managed via JSON files, generated from Excel imports using `scripts/import-stock.cjs`. `services/inventoryService.ts` handles stock data, which is dynamically integrated into the OpenAI context, allowing Emma to provide real-time availability and filter options based on format.

## External Dependencies

1.  **OpenAI API**: Used for all AI-powered conversational logic, dynamic formula generation, dosage personalization, and function calling.
2.  **Shopify Integration**: A mock `shopifyService.ts` exists, designed for future integration to fetch customer orders and generate product URLs.
3.  **Open-Meteo API**: Used for real-time weather data integration via function calling (free, no API key required).
4.  **Brave Search API**: Used for real-time web search queries via function calling through the backend proxy server. Returns top 3 search results with verified sources. Requires API key stored in `.env` as `BRAVE_SEARCH_API_KEY` (backend only, not exposed to frontend). Free tier includes 2,000 searches/month.
5.  **Vite**: Build tool and development server for the React application.
6.  **Tailwind CSS (CDN)**: Used for styling the user interface.
7.  **React Markdown**: For rendering rich text messages.