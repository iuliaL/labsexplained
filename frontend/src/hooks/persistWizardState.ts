import { useState, useEffect } from "react";

type Step = "welcome" | "account" | "name" | "demographics" | "upload";

export interface PatientData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  file?: File;
  testDate?: string;
}

interface WizardState {
  currentStep: Step;
  patientData: PatientData;
}

const LOCAL_STORAGE_KEY = "labsexplained-patient-wizard";

export function usePersistentWizard(initialStep: Step = "welcome") {
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [patientData, setPatientData] = useState<PatientData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
  });

  // Load saved state
  useEffect(() => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      try {
        const parsed: WizardState = JSON.parse(data);
        setPatientData(parsed.patientData);
        setCurrentStep(parsed.currentStep);
      } catch {
        console.warn("Failed to parse wizard state.");
      }
    }
  }, []);

  // Save state to local storage when patientData or currentStep changes
  useEffect(() => {
    const stateToStore: WizardState = { currentStep, patientData };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToStore));
  }, [patientData, currentStep]);

  const clearWizardState = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setPatientData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
    });
    setCurrentStep("welcome");
  };

  return {
    currentStep,
    setCurrentStep,
    patientData,
    setPatientData,
    clearWizardState,
  };
}
