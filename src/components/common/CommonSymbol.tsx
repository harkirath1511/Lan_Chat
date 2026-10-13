import React from 'react';

interface CommonSymbolProps {
  className?: string;
  size?: number;
  color?: string;
  lineColor?: string;
}

export const CommonSymbol: React.FC<CommonSymbolProps> = ({
  className = '',
  size = 24,
  color = 'currentColor',
  lineColor,
}) => {
  const connLineColor = lineColor || color;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Precision hairline connection conduits */}
      <line
        x1="16"
        y1="7"
        x2="7.5"
        y2="23.5"
        stroke={connLineColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.45"
      />
      <line
        x1="16"
        y1="7"
        x2="24.5"
        y2="23.5"
        stroke={connLineColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.45"
      />
      <line
        x1="7.5"
        y1="23.5"
        x2="24.5"
        y2="23.5"
        stroke={connLineColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Center connector focal point */}
      <circle cx="16" cy="18" r="1.5" fill={connLineColor} opacity="0.6" />

      {/* Top central hub node */}
      <circle cx="16" cy="7" r="4" fill={color} />
      <circle cx="16" cy="7" r="1.75" fill="#F4F1EB" opacity="0.9" />

      {/* Bottom left peer node */}
      <circle cx="7.5" cy="23.5" r="3.5" fill={color} />
      <circle cx="7.5" cy="23.5" r="1.5" fill="#F4F1EB" opacity="0.9" />

      {/* Bottom right peer node */}
      <circle cx="24.5" cy="23.5" r="3.5" fill={color} />
      <circle cx="24.5" cy="23.5" r="1.5" fill="#F4F1EB" opacity="0.9" />
    </svg>
  );
};
