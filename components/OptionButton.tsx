
import React from 'react';

interface OptionButtonProps {
  text: string;
  onClick: () => void;
  disabled: boolean;
}

const OptionButton: React.FC<OptionButtonProps> = ({ text, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-purple-100 text-purple-700 font-semibold rounded-full border border-purple-200 hover:bg-purple-200 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
    >
      {text}
    </button>
  );
};

export default OptionButton;
