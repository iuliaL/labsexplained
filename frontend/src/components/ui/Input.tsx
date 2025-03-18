import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = "", ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`
          w-full px-3 py-2
          bg-white
          text-slate-900
          text-sm
          placeholder:text-slate-400
          rounded-lg
          transition-colors
          border border-slate-200
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500/20
          focus:border-transparent
          focus:bg-blue-50/50
          disabled:bg-slate-50
          disabled:text-slate-500
          ${error ? "ring-2 ring-red-500/20 bg-red-50/50 border-transparent" : ""}
          ${className}
        `}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};
