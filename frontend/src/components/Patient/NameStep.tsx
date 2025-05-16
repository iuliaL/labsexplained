import { Input } from "@ui/Input";
import { useState } from "react";

interface NameStepProps {
  onNext: (data: { firstName: string; lastName: string }) => void;
  onBack: () => void;
}

export function NameStep({ onNext, onBack }: NameStepProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  return (
    <div className="space-y-6">
      {/* Explanation Card */}
      <div className="bg-blue-50 rounded-lg p-3 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Before we begin</h3>
            <div className="mt-1 text-xs text-blue-700">
              <p>
                To provide you with accurate lab result interpretations, we'll need some basic information. This helps
                us personalize the analysis based on your specific health context.
              </p>
            </div>
          </div>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onNext({ firstName, lastName });
        }}
      >
        <div className="space-y-4 mb-6">
          <Input
            id="firstName"
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            required
          />
          <Input
            id="lastName"
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            required
          />
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={!firstName || !lastName}
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400"
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
}
