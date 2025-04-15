import React from "react";

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const requirements = [
    { regex: /.{8,}/, text: "At least 8 characters" },
    { regex: /[A-Z]/, text: "At least one uppercase letter" },
    { regex: /[a-z]/, text: "At least one lowercase letter" },
    { regex: /[0-9]/, text: "At least one number" },
    { regex: /[@$!%*?&]/, text: "At least one special character (@$!%*?&)" },
  ];

  return (
    <div>
      <p className="text-sm text-red-600 font-medium">Password requirements:</p>
      <div className="mt-2 space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center text-sm">
            <svg
              className={`w-4 h-4 mr-2 ${req.regex.test(password) ? "text-green-500" : "text-red-500"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {req.regex.test(password) ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
            <span className={req.regex.test(password) ? "text-green-700" : "text-red-700"}>{req.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
