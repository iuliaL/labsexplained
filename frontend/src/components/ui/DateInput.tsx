import { CalendarIcon } from "@icons/CalendarIcon";
import { formatDate, isValidDate } from "@utils/dateFormatter";
import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
}

export function DateInput({
  label,
  value,
  onChange,
  required = false,
  error,
  className = "",
  ...props
}: DateInputProps) {
  const selectedDate = value && isValidDate(value) ? new Date(value) : null;

  return (
    <div className="w-full">
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative w-full">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => onChange(date ? date.toISOString() : "")}
          dateFormat="dd.MM.yyyy"
          wrapperClassName="block w-full"
          className={`
            w-full
            px-3 py-2
            bg-white
            text-slate-900
            text-sm
            placeholder:text-slate-400
            rounded-lg
            transition-colors
            border ${error ? "border-red-300" : "border-slate-200"}
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500/20
            focus:border-transparent
            focus:bg-blue-50/50
            disabled:bg-slate-50
            disabled:text-slate-500
            ${className}
          `}
          required={required}
          placeholderText="DD.MM.YYYY"
          customInput={<input {...props} className="w-full" />}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <CalendarIcon className="w-5 h-5" />
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
