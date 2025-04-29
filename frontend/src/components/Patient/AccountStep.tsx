import React from "react";
import { Input } from "../ui/Input";
import { PasswordRequirements } from "../ui/PasswordRequirements";
import { passwordRegex, emailRegex } from "../../utils/regexes";

interface AccountStepProps {
  email: string;
  password: string;
  onChange: (data: { email: string; password: string }) => void;
  onNext: () => void;
  onLogin: () => void;
  error?: string;
  loading?: boolean;
}

export const AccountStep: React.FC<AccountStepProps> = ({
  email,
  password,
  onChange,
  onNext,
  onLogin,
  error,
  loading = false,
}) => {
  const [showErrors, setShowErrors] = React.useState(false);
  const [privacyAccepted, setPrivacyAccepted] = React.useState(false);

  const emailError = showErrors && !emailRegex.test(email) ? "Please enter a valid email address" : undefined;
  const passwordError =
    showErrors && !passwordRegex.test(password) ? <PasswordRequirements password={password} /> : undefined;

  const isFormValid = emailRegex.test(email) && passwordRegex.test(password) && privacyAccepted;

  const handleNext = () => {
    if (isFormValid) {
      onNext();
    } else {
      setShowErrors(true);
    }
  };

  const handleLabelClick = (e: React.MouseEvent) => {
    // Prevent the click from propagating to the link
    if ((e.target as HTMLElement).tagName === "A") {
      return;
    }
    setPrivacyAccepted(!privacyAccepted);
  };

  return (
    <div className="space-y-4">
      {/* Explanation Card */}
      <div className="bg-blue-50 rounded-lg p-3 mb-4">
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
            <h3 className="text-sm font-medium text-blue-800">Create your account</h3>
            <div className="mt-1 text-xs text-blue-700">
              <p>
                To provide you with secure access to your lab results and interpretations, we need you to create an
                account. If you already have an account, you can log in instead.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => onChange({ email: e.target.value, password })}
          placeholder="Enter your email"
          required
          disabled={loading}
          error={emailError}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => onChange({ email, password: e.target.value })}
          placeholder="Create a password"
          required
          disabled={loading}
          error={passwordError}
        />
      </div>

      {/* Privacy Policy Checkbox */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="privacy-policy"
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="privacy-policy" className="font-medium text-slate-700" onClick={handleLabelClick}>
            I accept the{" "}
            <a
              href={process.env.REACT_APP_PRIVACY_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </a>
          </label>
          {showErrors && !privacyAccepted && (
            <p className="mt-1 text-red-600">You must accept the Privacy Policy to continue</p>
          )}
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</div>}

      <div className="space-y-4">
        <button
          onClick={handleNext}
          disabled={loading || (showErrors && !isFormValid)}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Loading...
            </>
          ) : (
            "Create Account"
          )}
        </button>
        <button
          onClick={onLogin}
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Already have an account? Log in
        </button>
      </div>
    </div>
  );
};
