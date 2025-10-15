export type Sender = 'user' | 'bot';

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  inputType?: 'options' | 'multiselect' | 'slider' | 'text';
  options?: string[];
  sliderConfig?: SliderConfig;
  component?: string; // e.g., 'Format', 'Ingredients', 'Dosage'
  isComplete?: boolean;
}

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
  recommendedValue?: number;
}

export interface Formula {
  Format?: string;
  Ingredients?: string[];
  Dosage?: string;
  FormulaName?: string;
}

// This is not used in the current workflow but kept for potential future use
export interface Order {
    id: string;
    name: string;
    date: string;
    formula: string;
}
