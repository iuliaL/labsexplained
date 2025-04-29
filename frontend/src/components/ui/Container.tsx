import { ReactNode } from "react";
import { UserIcon } from "../icons/UserIcon";
import { BrandLogo } from "../ui/BrandLogo";

import doctorImage from "../../assets/supawork-medic-logo.png";

interface ContainerProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function Container({ children, title, subtitle }: ContainerProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - Content */}
      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center px-4 sm:px-6 py-6">
        {/* Wave Shape */}
        <div className="absolute right-0 inset-y-0 w-[100px] translate-x-[98px]">
          <svg
            viewBox="0 0 100 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <path
              d="M0 0H30C55.2285 0 77.7285 155.455 77.7285 400C77.7285 644.545 55.2285 800 30 800H0V0Z"
              fill="rgb(248 250 252)"
              className="drop-shadow-md"
            />
          </svg>
        </div>

        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-5">
            <div className="h-8 w-8 mx-auto text-blue-600 mb-2">
              <UserIcon className="w-full h-full" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
          </div>

          {/* Form Card */}
          <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">{children}</div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block w-1/2 relative bg-slate-50">
        <div className="absolute inset-0">
          <img src={doctorImage} alt="Medical Professional" className="h-full w-full object-cover object-center" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/80 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
