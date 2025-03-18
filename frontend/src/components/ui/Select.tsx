import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className = "", ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`
          w-full px-3 py-2
          bg-white
          text-slate-900
          text-sm
          rounded-lg
          transition-colors
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500/20
          focus:bg-blue-50/50
          disabled:bg-slate-50
          disabled:text-slate-500
          appearance-none
          bg-no-repeat
          bg-[right_0.5rem_center]
          bg-[length:1.5em_1.5em]
          bg-[url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")]
          ${error ? "ring-2 ring-red-500/20 bg-red-50/50" : ""}
          ${className}
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};
