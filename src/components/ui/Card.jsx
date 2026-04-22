import React from 'react';
import clsx from 'clsx';

const Card = ({ children, title, subtitle, className }) => {
  return (
    <div
      className={clsx(
        'flex min-h-0 flex-col gap-5 rounded-xl border border-brand-khaki/60 bg-brand-beige p-8 shadow-lg',
        className,
      )}
    >
      {(title || subtitle) && (
        <div className="shrink-0 space-y-1">
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
      <div className="min-h-0 flex flex-1 flex-col">{children}</div>
    </div>
  );
};

export default Card;

