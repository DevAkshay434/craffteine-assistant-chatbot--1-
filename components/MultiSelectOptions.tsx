import React, { useState } from 'react';

interface MultiSelectOptionsProps {
  options: string[];
  onConfirm: (selected: string[]) => void;
  disabled: boolean;
}

const MultiSelectOptions: React.FC<MultiSelectOptionsProps> = ({ options, onConfirm, disabled }) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const handleToggle = (option: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedOptions.length > 0 && !disabled) {
      onConfirm(selectedOptions);
    }
  };

  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg w-full max-w-sm md:max-w-md">
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
        {options.map(option => (
          <button
            key={option}
            onClick={() => handleToggle(option)}
            disabled={disabled}
            className={`w-full text-left px-4 py-2 rounded-lg border transition-colors duration-200 ${
              selectedOptions.includes(option)
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {option}
          </button>
        ))}
      </div>
      <button
        onClick={handleConfirm}
        disabled={disabled || selectedOptions.length === 0}
        className="mt-4 w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg border border-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
      >
        Confirm Selection{selectedOptions.length !== 1 ? 's' : ''}
      </button>
    </div>
  );
};

export default MultiSelectOptions;
