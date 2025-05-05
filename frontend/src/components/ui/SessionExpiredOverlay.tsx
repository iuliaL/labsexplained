import { useNavigate } from "react-router-dom";
import { useAuth } from "@contexts/AuthContext";

interface SessionExpiredOverlayProps {
  onClose: () => void;
}

export function SessionExpiredOverlay({ onClose }: SessionExpiredOverlayProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleGoToLogin = () => {
    logout();
    onClose();
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Expired</h2>
        <p className="text-gray-600 mb-6">
          Your session has expired. For security reasons, sessions automatically expire after 1 hour. Please log in
          again to continue.
        </p>
        <div className="flex justify-end">
          <button
            onClick={handleGoToLogin}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}
