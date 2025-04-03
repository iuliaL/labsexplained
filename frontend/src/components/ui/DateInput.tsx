import React from "react";
import { formatDate, isValidDate } from "../../utils/dateFormatter";

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function DateInput({ label, value, onChange, required = false, className = "", ...props }: DateInputProps) {
  const displayValue = value && isValidDate(value) ? formatDate(value) : value;

  return (
    <div className="mb-4">
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
            ${className}
          `}
          required={required}
          {...props}
        />
        <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
          <span className="text-slate-900 text-sm">
            {displayValue || <span className="text-slate-400">DD.MM.YYYY</span>}
          </span>
        </div>
      </div>
    </div>
  );
}
