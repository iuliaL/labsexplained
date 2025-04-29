import React, { createContext, useContext, useState, useEffect } from "react";
import { SessionExpiredOverlay } from "../components/ui/SessionExpiredOverlay";

interface SessionContextType {
  showSessionExpired: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setIsSessionExpired(true);
    };

    window.addEventListener("session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("session-expired", handleSessionExpired);
    };
  }, []);

  const showSessionExpired = () => {
    setIsSessionExpired(true);
  };

  const handleClose = () => {
    setIsSessionExpired(false);
  };

  return (
    <SessionContext.Provider value={{ showSessionExpired }}>
      {children}
      {isSessionExpired && <SessionExpiredOverlay onClose={handleClose} />}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
