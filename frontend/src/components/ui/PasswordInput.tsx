import { EyeIcon } from "@icons/EyeIcon";
import { EyeOffIcon } from "@icons/EyeOffIcon";
import React, { useState } from "react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | React.ReactNode;
  required?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  required = false,
  className = "",
  ...props
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="w-full relative">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        {...props}
        type={show ? "text" : "password"}
        required={required}
        className={`
          relative
          w-full px-3 py-2 pr-10
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
          ${error ? "ring-2 ring-red-500/20 bg-red-50/50 border-transparent" : ""}
          ${className}
        `}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
        style={{ top: 43 }}
        className="absolute right-2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none"
        onClick={() => setShow((v) => !v)}
      >
        {show ? <EyeOffIcon width={20} height={20} /> : <EyeIcon width={20} height={20} />}
      </button>
      {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
    </div>
  );
};
