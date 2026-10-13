import React from 'react';
import { CommonSymbol } from './CommonSymbol';

interface CommonWordmarkProps {
  className?: string;
  symbolSize?: number;
  textColor?: string;
  symbolColor?: string;
  onClick?: () => void;
}

export const CommonWordmark: React.FC<CommonWordmarkProps> = ({
  className = '',
  symbolSize = 22,
  textColor = 'text-[#202522]',
  symbolColor = '#202522',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none group ${className}`}
    >
      <CommonSymbol
        size={symbolSize}
        color={symbolColor}
        className="transition-transform duration-300 group-hover:scale-105"
      />
      <span
        className={`font-serif text-xl tracking-[0.12em] font-semibold uppercase leading-none transition-opacity duration-200 ${textColor}`}
      >
        Common
      </span>
    </div>
  );
};
