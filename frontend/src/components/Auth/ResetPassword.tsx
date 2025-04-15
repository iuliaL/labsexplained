import { Input } from "../ui/Input";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Container from "../ui/Container";
import { PasswordRequirements } from "../ui/PasswordRequirements";
import { passwordRegex } from "../../utils/regexes";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const handleSubmit = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Please enter both new password and confirmation");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!passwordRegex.test(formData.newPassword)) {
      setShowErrors(true);
      setError("Please ensure your password meets all requirements");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          new_password: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to reset password");
      }

      setSuccess(true);
      // Navigate to login page after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container
        title="Password Reset Successful"
        subtitle="You will be redirected to the login page in a few seconds..."
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900">Password reset successful!</h3>
          <p className="mt-2 text-sm text-gray-600">
            Your password has been reset successfully. You will be redirected to the login page in a few seconds...
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container title="Reset Your Password" subtitle="Enter your new password below">
      <div className="space-y-6">
        <div className="space-y-4">
          <Input
            id="newPassword"
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            placeholder="Enter your new password"
            required
            disabled={loading}
          />
          {showErrors && <PasswordRequirements password={formData.newPassword} />}
          <Input
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Confirm your new password"
            required
            disabled={loading}
          />
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</div>}

        <div className="space-y-4">
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.newPassword || !formData.confirmPassword}
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
                Resetting password...
              </span>
            ) : (
              "Reset Password"
            )}
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Login
          </button>
        </div>
      </div>
    </Container>
  );
}
