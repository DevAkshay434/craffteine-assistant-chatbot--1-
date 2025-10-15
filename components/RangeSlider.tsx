import React, { useState } from 'react';
import type { SliderConfig } from '../types';

interface RangeSliderProps {
  config: SliderConfig;
  onConfirm: (value: string) => void;
  disabled: boolean;
}

const RangeSlider: React.FC<RangeSliderProps> = ({ config, onConfirm, disabled }) => {
  const [value, setValue] = useState(config.defaultValue);

  const handleConfirm = () => {
    if (!disabled) {
        onConfirm(`${value}${config.unit}`);
    }
  };

  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg w-full">
        <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Dosage</span>
            <span className="px-2 py-1 text-sm font-bold text-purple-800 bg-purple-200 rounded-md">
                {value} {config.unit}
            </span>
        </div>
        {config.recommendedValue && (
          <div className="text-center text-xs text-purple-700 font-medium mb-3">
            ✨ Recommended: {config.recommendedValue}{config.unit}
          </div>
        )}
        <input
            type="range"
            min={config.min}
            max={config.max}
            step={config.step}
            value={value}
            onChange={(e) => setValue(parseInt(e.target.value, 10))}
            disabled={disabled}
            className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:bg-gray-200 disabled:accent-gray-400"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{config.min}{config.unit}</span>
            <span>{config.max}{config.unit}</span>
        </div>
        <button
            onClick={handleConfirm}
            disabled={disabled}
            className="mt-4 w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg border border-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
        >
            Confirm
        </button>
    </div>
  );
};

export default RangeSlider;