import React from 'react';
import clsx from 'clsx';

const Button = ({ children, className, disabled, ...props }) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md border border-transparent bg-brand-brown px-4 py-2 text-sm font-medium text-brand-beige hover:bg-[#7b5e4f] focus:outline-none focus:ring-2 focus:ring-brand-khaki focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <button
      type="button"
      disabled={disabled}
      className={clsx(baseClasses, className)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

