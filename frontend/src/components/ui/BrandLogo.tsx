import logo from "@assets/logo.png";
import React from "react";

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 120, className = "" }) => (
  <img
    src={logo}
    alt="LabsExplained Logo"
    width={size}
    height={size}
    className={`object-contain ${className}`}
    style={{ maxWidth: size, maxHeight: size }}
  />
);
