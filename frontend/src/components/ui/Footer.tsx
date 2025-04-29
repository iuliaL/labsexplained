import React from "react";
import { BrandLogo } from "./BrandLogo";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => (
  <footer className="w-full bg-slate-50 border-t border-slate-200 py-4 px-6 flex items-center justify-between mt-12">
    <div className="flex items-center">
      <BrandLogo />
    </div>
    <div>
      <Link to={process.env.REACT_APP_PRIVACY_POLICY_URL || "/privacy"} className="text-slate-500 hover:text-blue-600 text-sm transition-colors">
        Privacy Policy
      </Link>
    </div>
  </footer>
);
