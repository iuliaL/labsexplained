import { DateInput } from "../ui/DateInput";
import { Select } from "../ui/Select";
import { useState } from "react";

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
  const [touched, setTouched] = useState({
    dateOfBirth: false,
    gender: false,
  });

  const handleNext = () => {
    setTouched({
      dateOfBirth: true,
      gender: true,
    });
    if (dateOfBirth && gender) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <DateInput
          id="dateOfBirth"
          label="Date of birth"
          value={dateOfBirth}
          onChange={(value) => {
            setTouched((prev) => ({ ...prev, dateOfBirth: true }));
            onChange({ dateOfBirth: value, gender });
          }}
          max={new Date().toISOString().split("T")[0]}
          required
          error={touched.dateOfBirth && !dateOfBirth ? "Date of birth is required" : undefined}
        />
        <Select
          id="gender"
          label="Gender"
          value={gender}

          onChange={(value) => {
            setTouched((prev) => ({ ...prev, gender: true }));
            onChange({ dateOfBirth, gender: value });
          }}
          options={genderOptions}
          required
          error={touched.gender && !gender ? "Gender is required" : undefined}
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
          onClick={handleNext}
          className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400"
        >
          Next
        </button>
      </div>
    </div>
  );
}
