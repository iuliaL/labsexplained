import React from "react";

interface UserIconProps {
  className?: string;
}

export const UserIcon: React.FC<UserIconProps> = ({ className = "" }) => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12,2L12,2c-3.3,0-6,2.7-6,6v2c0,3.3,2.7,6,6,6h0c3.3,0,6-2.7,6-6V8C18,4.7,15.3,2,12,2z" />
      <path d="M12,16c-4.4,0-8,3.6-8,8h16C20,19.6,16.4,16,12,16z" />
    </svg>
  );
};
