import React from "react";
import { BrandLogo } from "./BrandLogo";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => (
  <footer className="w-full bg-slate-50 border-t border-slate-200 py-4 px-6 flex flex-col gap-2 items-center justify-between mt-12">
    <div className="w-full flex items-center justify-between">
      <div>
        <Link
          to={process.env.REACT_APP_PRIVACY_POLICY_URL || "/privacy"}
          className="text-blue-500 hover:text-blue-600 text-sm transition-colors"
        >
          Privacy Policy
        </Link>
      </div>
      <div className="flex items-center mr-1">
        <BrandLogo />
      </div>
    </div>
    <div className="w-full text-right text-xs text-slate-400 mt-1 pr-1">
      © {new Date().getFullYear()} LabsExplained. All rights reserved.
    </div>
  </footer>
);
