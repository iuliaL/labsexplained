import React from "react";

interface LabTestIconProps {
  className?: string;
}

export const LabTestIcon: React.FC<LabTestIconProps> = ({ className = "" }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17 8h2v12c0 2.209-1.791 4-4 4s-4-1.791-4-4v-12h2v3h3v8.823c0 .973-.328 1.692-1.014 2.175l.014.002c1.103 0 2-.897 2-2v-12zm2-4h-8c-.552 0-1 .448-1 1s.448 1 1 1h8c.553 0 1-.448 1-1s-.447-1-1-1zm-12 12v-3h2v-1h-2v-1h2v-1h-2v-1h2v-1h-2v-1h2v-1h-2v-1h2v-1h-4v12c0 2.209 1.791 4 4 4v-2c-1.103 0-2-.897-2-2zm4-14h2c.553 0 1-.448 1-1s-.447-1-1-1h-8c-.552 0-1 .448-1 1s.448 1 1 1h6z" />
    </svg>
  );
};
