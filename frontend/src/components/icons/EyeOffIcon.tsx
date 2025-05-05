import React from "react";

export const EyeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M17.94 17.94A10.97 10.97 0 0 1 12 19.5C6 19.5 1.5 12 1.5 12a21.8 21.8 0 0 1 5.06-6.06" />
    <path d="M22.5 12s-1.5-2.5-4.5-4.5M9.53 9.53A3.5 3.5 0 0 0 12 16a3.5 3.5 0 0 0 2.47-6.47" />
    <line x1="1.5" y1="1.5" x2="22.5" y2="22.5" />
  </svg>
);
