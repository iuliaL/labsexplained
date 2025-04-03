import { Input } from "./ui/Input";

interface NameStepProps {
  firstName: string;
  lastName: string;
  onChange: (data: { firstName: string; lastName: string }) => void;
  onNext: () => void;
}

export function NameStep({ firstName, lastName, onChange, onNext }: NameStepProps) {
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
            <h3 className="text-sm font-medium text-blue-800">Before We Begin</h3>
            <div className="mt-1 text-xs text-blue-700">
              <p>
                To provide you with accurate lab result interpretations, we'll need some basic information. This helps
                us personalize the analysis based on your specific health context.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          id="firstName"
          label="First Name"
          value={firstName}
          onChange={(e) => onChange({ firstName: e.target.value, lastName })}
          placeholder="First name"
          required
        />
        <Input
          id="lastName"
          label="Last Name"
          value={lastName}
          onChange={(e) => onChange({ firstName, lastName: e.target.value })}
          placeholder="Last name"
          required
        />
      </div>

      <button
        onClick={onNext}
        disabled={!firstName || !lastName}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400"
      >
        Next
      </button>
    </div>
  );
}
