import React, { useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ConfirmDialog } from "./ConfirmDialog";
import  LabSetIcon  from "../icons/LabSetIcon";
import PatientIcon from "../icons/PatientIcon";

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, fhirId, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setTimeout(() => {
      navigate("/login");
    }, 100);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-40 px-6 py-3">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <BrandLogo />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-4 items-center">
          {role === "admin" &&
            (location.pathname.includes("/admin/") ? (
              <button
                onClick={() => navigate(`/patient/${fhirId}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <PatientIcon />
                My patient dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate(`/admin/patients`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <LabSetIcon />
                Admin Dashboard
              </button>
            ))}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 relative w-8 h-8"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          <div className="absolute inset-0 w-full h-full flex items-center justify-center">
            <span
              className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-in-out ${
                isMenuOpen ? "rotate-45" : "-translate-y-2"
              }`}
            />
            <span
              className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-in-out ${
                isMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-in-out ${
                isMenuOpen ? "-rotate-45" : "translate-y-2"
              }`}
            />
          </div>
        </button>

        {/* Mobile Menu Dropdown */}
        <div
          className={`absolute top-full right-0 w-64 mt-2 py-2 bg-white rounded-lg shadow-xl border border-gray-100 md:hidden transform transition-all duration-300 ease-in-out origin-top-right ${
            isMenuOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
          }`}
        >
          {role === "admin" && (
            <button
              onClick={() => {
                location.pathname.includes("/admin/") ? navigate(`/patient/${fhirId}`) : navigate(`/admin/patients`);
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-gray-50"
            >
              {location.pathname.includes("/admin/") ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  My patient dashboard
                </>
              ) : (
                <>
                  <LabSetIcon />  
                  Admin Dashboard
                </>
              )}
            </button>
          )}
          <button
            onClick={() => {
              setShowLogoutConfirm(true);
              setIsMenuOpen(false);
            }}
            className="w-full flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        variant="primary"
      />
    </header>
  );
};
