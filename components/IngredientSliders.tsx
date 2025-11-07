import React, { useState } from 'react';
import type { Ingredient } from '../types';

interface IngredientSlidersProps {
  ingredients: Ingredient[];
  onConfirm: (dosages: string) => void;
  disabled: boolean;
}

const IngredientSliders: React.FC<IngredientSlidersProps> = ({ ingredients, onConfirm, disabled }) => {
  const initialDosages: { [key: string]: number } = {};
  ingredients.forEach(ing => {
    initialDosages[ing.name] = ing.suggested;
  });
  
  const [dosages, setDosages] = useState(initialDosages);

  const handleSliderChange = (ingredientName: string, value: number) => {
    setDosages(prev => ({ ...prev, [ingredientName]: value }));
  };

  const handleConfirm = () => {
    if (!disabled) {
      // Convert dosages object to JSON string
      onConfirm(JSON.stringify(dosages));
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="space-y-2 mb-3 max-h-80 overflow-y-auto">
        {ingredients.map((ingredient) => (
          <div key={ingredient.name} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-gray-800">{ingredient.name}</span>
              <span className="px-2 py-1 text-xs font-bold text-purple-800 bg-purple-200 rounded">
                {dosages[ingredient.name]} {ingredient.unit}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-2">{ingredient.rationale}</p>
            <input
              type="range"
              min={ingredient.min}
              max={ingredient.max}
              step={(ingredient.max - ingredient.min) / 20}
              value={dosages[ingredient.name]}
              onChange={(e) => handleSliderChange(ingredient.name, parseInt(e.target.value, 10))}
              disabled={disabled}
              className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:bg-gray-200 disabled:accent-gray-400"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{ingredient.min}{ingredient.unit}</span>
              <span>{ingredient.max}{ingredient.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleConfirm}
        disabled={disabled}
        className="w-full px-4 py-2 bg-purple-600 text-white font-bold text-sm rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed sticky bottom-0 shadow-lg"
      >
        Confirm Dosages
      </button>
    </div>
  );
};

export default IngredientSliders;
