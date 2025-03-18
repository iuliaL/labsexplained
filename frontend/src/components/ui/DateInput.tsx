import React from "react";

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  label?: string;
  error?: string;
  value: string; // Expected in YYYY-MM-DD format
  onChange: (value: string) => void; // Will return in YYYY-MM-DD format
}

export const DateInput: React.FC<DateInputProps> = ({ label, error, value, onChange, className = "", ...props }) => {
  // Only format the date for display, keep the value in ISO format
  const formattedDate = value
    ? new Date(value).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // The native date input will give us YYYY-MM-DD format, which is what we want
    onChange(e.target.value);
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          type="date"
          value={value} // Keep as YYYY-MM-DD
          onChange={handleChange}
          className={`
            w-full px-3 py-2
            bg-white
            text-transparent
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
            [&::-webkit-datetime-edit]:hidden
            [&::-webkit-calendar-picker-indicator]:ml-auto
            ${error ? "ring-2 ring-red-500/20 bg-red-50/50 border-transparent" : ""}
            ${className}
          `}
          required
        />
        <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
          <span className="text-slate-900 text-sm">
            {value ? formattedDate : <span className="text-slate-400">DD.MM.YYYY</span>}
          </span>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};
