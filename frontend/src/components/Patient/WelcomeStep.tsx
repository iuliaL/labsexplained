import React from "react";

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => (
  <div className="text-center space-y-6">
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">Understand your lab results with AI</h2>
      <p className="text-slate-600 max-w-md mx-auto">
        Upload your lab results and get instant, personalized interpretations powered by advanced AI. Our system helps
        you understand your health data in plain language.
      </p>
      <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm">
        ✨ Free service - No credit card required
      </div>
    </div>

    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-6">
        <div className="flex items-center text-slate-600">
          <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Quick analysis</span>
        </div>
        <div className="flex items-center text-slate-600">
          <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Easy to understand</span>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-6">
        <div className="flex items-center text-slate-600">
          <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Secure</span>
        </div>
        <div className="flex items-center text-slate-600">
          <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>24/7 Available</span>
        </div>
      </div>
    </div>

    <button
      onClick={onNext}
      className="w-full max-w-sm mx-auto flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
    >
      Try It Now
    </button>
  </div>
);
