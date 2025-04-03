import { DateInput } from "./ui/DateInput";
import { Select } from "./ui/Select";

interface DemographicsStepProps {
  dateOfBirth: string;
  gender: string;
  onChange: (data: { dateOfBirth: string; gender: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

const genderOptions = [
  { value: "", label: "Select gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export function DemographicsStep({ dateOfBirth, gender, onChange, onNext, onBack }: DemographicsStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <DateInput
          id="dateOfBirth"
          label="Date of birth"
          value={dateOfBirth}
          onChange={(value) => onChange({ dateOfBirth: value, gender })}
          required
        />
        <Select
          id="gender"
          label="Gender"
          value={gender}
          onChange={(value) => onChange({ dateOfBirth, gender: value })}
          options={genderOptions}
          required
        />
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="flex-1 py-2 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!dateOfBirth || !gender}
          className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400"
        >
          Next
        </button>
      </div>
    </div>
  );
}
