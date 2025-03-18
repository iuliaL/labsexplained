interface NameStepProps {
  firstName: string;
  lastName: string;
  onChange: (data: { firstName: string; lastName: string }) => void;
  onNext: () => void;
}

export function NameStep({ firstName, lastName, onChange, onNext }: NameStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
          First Name
        </label>
        <input
          type="text"
          id="firstName"
          value={firstName}
          onChange={(e) => onChange({ firstName: e.target.value, lastName })}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
          Last Name
        </label>
        <input
          type="text"
          id="lastName"
          value={lastName}
          onChange={(e) => onChange({ firstName, lastName: e.target.value })}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
