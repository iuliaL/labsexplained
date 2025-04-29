import React from "react";
import { BrandLogo } from "./BrandLogo";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { to: "/login", label: "Login" },
  { to: "/admin/patients", label: "Admin" },
  { to: "/about", label: "About" },
];

export const Header: React.FC = () => {
  const location = useLocation();
  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-40 px-6 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center">
        <BrandLogo />
      </Link>
      <nav className="flex gap-6 items-center">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`text-base font-medium transition-colors ${
              location.pathname === link.to ? "text-blue-600" : "text-slate-600 hover:text-blue-600"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};
