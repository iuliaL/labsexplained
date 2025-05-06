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
          minDate={new Date(1900, 0, 1)}
          renderCustomHeader={({
            date,
            changeYear,
            changeMonth,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => (
            <div className="flex items-center justify-between px-4 py-2">
              <button
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
                type="button"
                className={`p-1 ${prevMonthButtonDisabled ? "text-gray-300" : "text-gray-700 hover:text-blue-500"}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex gap-1">
                <select
                  value={date.getMonth()}
                  onChange={({ target: { value } }) => changeMonth(Number(value))}
                  className="text-sm font-semibold text-gray-700 bg-white hover:text-blue-500 cursor-pointer appearance-none border-none focus:ring-0 focus:outline-none p-1"
                >
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((month, i) => (
                    <option key={month} value={i}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={date.getFullYear()}
                  onChange={({ target: { value } }) => changeYear(Number(value))}
                  className="text-sm font-semibold text-gray-700 bg-white hover:text-blue-500 cursor-pointer appearance-none border-none focus:ring-0 focus:outline-none p-1"
                >
                  {Array.from({ length: 126 }, (_, i) => 2025 - i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={increaseMonth}
                disabled={nextMonthButtonDisabled}
                type="button"
                className={`p-1 ${nextMonthButtonDisabled ? "text-gray-300" : "text-gray-700 hover:text-blue-500"}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
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
    padding: 0;
  }
  .react-datepicker__current-month {
    font-weight: 600;
    color: #1e293b;
    display: flex;
    justify-content: center;
    gap: 0.5rem;
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
  .react-datepicker__month-dropdown-container,
  .react-datepicker__year-dropdown-container {
    display: inline-block;
    margin: 0 0.5rem;
  }
  .react-datepicker__month-read-view,
  .react-datepicker__year-read-view {
    visibility: visible !important;
  }
  .react-datepicker__month-read-view--down-arrow,
  .react-datepicker__year-read-view--down-arrow {
    border-color: #64748b;
    top: 5px;
  }
  .react-datepicker__month-dropdown,
  .react-datepicker__year-dropdown {
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    padding: 0.5rem 0;
    width: auto;
    min-width: 120px;
  }
  .react-datepicker__month-option,
  .react-datepicker__year-option {
    padding: 0.5rem 1rem;
    margin: 0;
    cursor: pointer;
    text-align: left;
  }
  .react-datepicker__month-option:hover,
  .react-datepicker__year-option:hover {
    background-color: #eff6ff;
    color: #3b82f6;
  }
  .react-datepicker__month-option--selected,
  .react-datepicker__year-option--selected {
    background-color: #3b82f6;
    color: white;
    position: relative;
  }
  .react-datepicker__month-option--selected_month,
  .react-datepicker__year-option--selected_year {
    font-weight: 600;
  }
  .react-datepicker__navigation--years {
    background: none;
    border: none;
    text-align: center;
    cursor: pointer;
    padding: 0.5rem;
    margin: 0;
    text-decoration: none;
  }
  .react-datepicker__navigation--years:hover {
    background-color: #eff6ff;
    color: #3b82f6;
  }
`;
document.head.appendChild(style);
