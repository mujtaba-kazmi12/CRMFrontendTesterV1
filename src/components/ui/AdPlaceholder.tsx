import React from 'react';

interface AdPlaceholderProps {
  width: number;
  height: number;
  className?: string;
  text?: string;
}

export function AdPlaceholder({ 
  width, 
  height, 
  className = '', 
  text = 'Ad Banner' 
}: AdPlaceholderProps) {
  return (
    <div 
      className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 ${className}`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`
      }}
    >
      <div className="text-xs uppercase tracking-widest mb-1">Publicité</div>
      <div className="text-sm font-medium">{text}</div>
      <div className="text-xs mt-1 opacity-60">{width} × {height}</div>
    </div>
  );
} 