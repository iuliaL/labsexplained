import { CalendarIcon } from "@icons/CalendarIcon";
import React, { useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  required?: boolean;
  error?: string;
  maxDate?: Date;
}

export function DateInput({
  label,
  value,
  onChange,
  required = false,
  error,
  maxDate,
  className = "",
  ...props
}: DateInputProps) {
  const datePickerRef = useRef<DatePicker>(null);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      onChange(date);
    } else {
      onChange(null);
    }
  };

  const handleCalendarClick = () => {
    datePickerRef.current?.setOpen(true);
  };

  return (
    <div className="w-full">
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative w-full">
        <DatePicker
          ref={datePickerRef}
          selected={value}
          onChange={handleDateChange}
          maxDate={maxDate}
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
          calendarClassName="border-0 shadow-lg rounded-lg overflow-hidden"
          dayClassName={(date) =>
            date.toDateString() === value?.toDateString()
              ? "bg-blue-500 text-white rounded-full hover:bg-blue-600"
              : "hover:bg-blue-50 rounded-full"
          }
          popperClassName="react-datepicker-popper"
          popperModifiers={[
            {
              name: "offset",
              options: {
                offset: [0, 8],
              },
              fn: (state) => state,
            },
          ]}
        />
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-blue-500 transition-colors"
          onClick={handleCalendarClick}
        >
          <CalendarIcon className="w-5 h-5" />
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Add custom styles to the document head
const style = document.createElement("style");
style.textContent = `
  .react-datepicker {
    font-family: inherit;
    border: 1px solid #e5e7eb;

  }
  .react-datepicker__triangle {
    display: none;
  }
  .react-datepicker__header {
    background-color: white;
    border-bottom: 1px solid #e5e7eb;
    padding-top: 1rem;
  }
  .react-datepicker__current-month {
    font-weight: 600;
    color: #1e293b;
  }
  .react-datepicker__day-name {
    color: #64748b;
  }
  .react-datepicker__day--keyboard-selected {
    background-color: #3b82f6 !important;
    color: white !important;
  }
  .react-datepicker__day--today {
    font-weight: 600;
    color: #3b82f6;
  }
  .react-datepicker__navigation-icon::before {
    border-color: #64748b;
  }
  .react-datepicker__navigation:hover *::before {
    border-color: #3b82f6;
  }
`;
document.head.appendChild(style);
