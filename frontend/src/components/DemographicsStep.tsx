interface DemographicsStepProps {
  dateOfBirth: string;
  gender: string;
  onChange: (data: { dateOfBirth: string; gender: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DemographicsStep({ dateOfBirth, gender, onChange, onNext, onBack }: DemographicsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
          Date of Birth
        </label>
        <input
          type="date"
          id="dateOfBirth"
          value={dateOfBirth}
          onChange={(e) => onChange({ dateOfBirth: e.target.value, gender })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
          Gender
        </label>
        <select
          id="gender"
          value={gender}
          onChange={(e) => onChange({ dateOfBirth, gender: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!dateOfBirth || !gender}
          className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          Next
        </button>
      </div>
    </div>
  );
}
