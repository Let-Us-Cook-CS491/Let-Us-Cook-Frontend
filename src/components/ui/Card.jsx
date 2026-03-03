import React from 'react';

const Card = ({ children, title, subtitle }) => {
  return (
    <div className="rounded-xl border border-brand-khaki/60 bg-brand-beige shadow-lg p-8 space-y-5">
      {(title || subtitle) && (
        <div className="space-y-1">
          {title && (
            <h1 className="text-xl font-semibold text-brand-dark">{title}</h1>
          )}
          {subtitle && (
            <p className="text-sm text-brand-dark/70">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;

