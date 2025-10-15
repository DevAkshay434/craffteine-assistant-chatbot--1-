import React, { useState, KeyboardEvent } from 'react';

interface InlineTextInputProps {
  onConfirm: (text: string) => void;
  placeholder?: string;
  disabled: boolean;
}

const InlineTextInput: React.FC<InlineTextInputProps> = ({ onConfirm, placeholder = "e.g., Morning Boost", disabled }) => {
  const [text, setText] = useState('');

  const handleConfirm = () => {
    if (text.trim() && !disabled) {
      onConfirm(text.trim());
      setText('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-grow px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
        aria-label="Formula name input"
      />
      <button
        onClick={handleConfirm}
        disabled={disabled || !text.trim()}
        className="px-4 py-2 text-sm bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirm
      </button>
    </div>
  );
};

export default InlineTextInput;
