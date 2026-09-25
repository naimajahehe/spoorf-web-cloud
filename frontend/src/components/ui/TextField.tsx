import React from 'react';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
}

export const TextField: React.FC<TextFieldProps> = ({ id, label, hint, className = '', ...inputProps }) => {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hintId}
        className={`w-full px-3.5 py-2.5 rounded-xl bg-white border border-border text-sm text-foreground placeholder:text-ink/40 shadow-sm transition-colors focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
};

export default TextField;
