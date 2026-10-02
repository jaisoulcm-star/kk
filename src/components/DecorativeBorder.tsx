import React from "react";

export const DecorativeBorder: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div
      className={`w-full h-12 relative flex items-center justify-center overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 zari-text opacity-10 flex">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="text-4xl font-serif leading-none rotate-45 select-none"
          >
            ❖
          </span>
        ))}
      </div>
      <div className="w-full h-px bg-heritage-gold/30 relative z-10" />
      <div className="px-8 bg-heritage-stone relative z-20">
        <span className="text-heritage-gold font-serif italic text-xl">
          Heritage
        </span>
      </div>
    </div>
  );
};
