import { Input } from "../ui/Input";

interface LoginProps {
  email: string;
  password: string;
  onChange: (data: { email: string; password: string }) => void;
  onSubmit: () => void;
  onBack: () => void;
  error?: string;
  loading?: boolean;
}

export function Login({ email, password, onChange, onSubmit, onBack, error, loading = false }: LoginProps) {
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
            <h3 className="text-sm font-medium text-blue-800">Welcome Back</h3>
            <div className="mt-1 text-xs text-blue-700">
              <p>Please enter your credentials to access your lab results and interpretations.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => onChange({ email: e.target.value, password })}
          placeholder="Enter your email"
          required
          disabled={loading}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => onChange({ email, password: e.target.value })}
          placeholder="Enter your password"
          required
          disabled={loading}
        />
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</div>}

      <div className="space-y-4">
        <button
          onClick={onSubmit}
          disabled={!email || !password || loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Logging in...
            </span>
          ) : (
            "Log In"
          )}
        </button>
        <button
          onClick={onBack}
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Create Account
        </button>
      </div>
    </div>
  );
}
