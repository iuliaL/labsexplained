import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "../ui/Input";
import { UserIcon } from "../icons/UserIcon";
import doctorImage from "../../assets/supawork-medic.png";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

interface PasswordRequirementsProps {
  password: string;
}

function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const requirements = [
    { regex: /.{8,}/, text: "At least 8 characters" },
    { regex: /[A-Z]/, text: "At least one uppercase letter" },
    { regex: /[a-z]/, text: "At least one lowercase letter" },
    { regex: /[0-9]/, text: "At least one number" },
    { regex: /[@$!%*?&]/, text: "At least one special character (@$!%*?&)" },
  ];

  return (
    <div className="mt-2 space-y-1">
      {requirements.map((req, index) => (
        <div key={index} className="flex items-center text-sm">
          <svg
            className={`w-4 h-4 mr-2 ${req.regex.test(password) ? "text-green-500" : "text-red-500"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {req.regex.test(password) ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            )}
          </svg>
          <span className={req.regex.test(password) ? "text-green-700" : "text-red-700"}>{req.text}</span>
        </div>
      ))}
    </div>
  );
}

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

  const handleSubmit = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!passwordRegex.test(formData.newPassword)) {
      setError("Please ensure your password meets all requirements");
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
      <div className="min-h-screen bg-slate-50 flex">
        <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center px-4 sm:px-6 py-6">
          <div className="w-full max-w-md">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">Password reset successful!</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Your password has been reset successfully. You will be redirected to the login page in a few
                  seconds...
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden lg:block w-1/2 relative bg-slate-50">
          <div className="absolute inset-0">
            <img src={doctorImage} alt="Medical Professional" className="h-full w-full object-cover object-center" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/80 to-transparent pointer-events-none" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - Content */}
      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center px-4 sm:px-6 py-6">
        {/* Wave Shape */}
        <div className="absolute right-0 inset-y-0 w-[100px] translate-x-[98px]">
          <svg
            viewBox="0 0 100 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <path
              d="M0 0H30C55.2285 0 77.7285 155.455 77.7285 400C77.7285 644.545 55.2285 800 30 800H0V0Z"
              fill="rgb(248 250 252)"
              className="drop-shadow-md"
            />
          </svg>
        </div>

        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-7">
            <div className="h-8 w-8 mx-auto text-blue-600 mb-3">
              <UserIcon className="w-full h-full" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Reset Your Password</h1>
            <p className="mt-2 text-sm text-slate-600">Enter your new password below</p>
          </div>

          {/* Form Card */}
          <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
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
                <PasswordRequirements password={formData.newPassword} />
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
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
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
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block w-1/2 relative bg-slate-50">
        <div className="absolute inset-0">
          <img src={doctorImage} alt="Medical Professional" className="h-full w-full object-cover object-center" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/80 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
