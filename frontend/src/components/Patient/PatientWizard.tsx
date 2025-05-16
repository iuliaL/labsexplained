import { useAuth } from "@contexts/AuthContext";
import { adminService } from "@services/admin";
import { authService } from "@services/auth";
import Container from "@ui/Container";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AccountStep } from "./AccountStep";
import { DemographicsStep } from "./DemographicsStep";
import { NameStep } from "./NameStep";
import { UploadStep } from "./UploadStep";
import { WelcomeStep } from "./WelcomeStep";

type Step = "welcome" | "account" | "name" | "demographics" | "upload";

interface ProcessingState {
  uploadLabTest: "pending" | "loading" | "completed" | "error";
  interpretResults: "pending" | "loading" | "completed" | "error";
  error?: string;
}

interface PatientWizardProps {
  initialStep?: Step;
}

export default function PatientWizard({ initialStep = "welcome" }: PatientWizardProps) {
  const navigate = useNavigate();
  const { fhirId } = useParams<{ fhirId: string }>();
  const { login } = useAuth();

  // const { currentStep, setCurrentStep, clearWizardState } = usePersistentWizard(initialStep);
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    uploadLabTest: "pending",
    interpretResults: "pending",
  });

  const nextStep = (fhir_id: string) => {
    let nextPath = "/wizard/";
    let nextStepValue: Step = "welcome";

    switch (currentStep) {
      case "welcome":
        nextPath = "/wizard/account";
        nextStepValue = "account";
        break;
      case "account":
        nextPath = `/wizard/name/${fhir_id}`;
        nextStepValue = "name";
        break;
      case "name":
        nextPath = `/wizard/demographics/${fhir_id}`;
        nextStepValue = "demographics";
        break;
      case "demographics":
        nextPath = `/wizard/upload/${fhir_id}`;
        nextStepValue = "upload";
        break;
    }

    setCurrentStep(nextStepValue);
    navigate(nextPath);
  };

  const prevStep = (fhir_id: string) => {
    let prevPath = "/wizard/";
    let prevStepValue: Step = "welcome";

    switch (currentStep) {
      case "account":
        prevPath = "/wizard/";
        prevStepValue = "welcome";
        break;
      case "name":
        prevPath = "/wizard/account";
        prevStepValue = "account";
        break;
      case "demographics":
        prevPath = `/wizard/name/${fhir_id}`;
        prevStepValue = "name";
        break;
      case "upload":
        prevPath = `/wizard/demographics/${fhir_id}`;
        prevStepValue = "demographics";
        break;
    }

    setCurrentStep(prevStepValue);
    navigate(prevPath);
  };

  const getStepTitle = (step: Step) => {
    switch (step) {
      case "welcome":
        return "Welcome";
      case "account":
        return "Account Information";
      case "name":
        return "Patient Information";
      case "demographics":
        return "Patient Demographics";
      case "upload":
        return "Upload Lab Results";
    }
  };

  const handleEmailSubmit = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      // Check if email exists
      const emailExists = await authService.checkEmailExists(email);

      if (emailExists) {
        setError("Email already exists. Please log in instead.");
      } else {
        try {
          const { fhir_id } = await adminService.createPatient({ email, password });
          await login(email, password);
          nextStep(fhir_id);
        } catch (err) {
          console.error("Error creating patient:", err);
          setError("An error occurred while creating your account. Please try again.");
        }
      }
    } catch (err) {
      setError("An error occurred while checking your email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async ({ firstName, lastName }: { firstName: string; lastName: string }) => {
    setLoading(true);
    setError(null);
    try {
      await adminService.updatePatient(fhirId!, { firstName, lastName });

      nextStep(fhirId!);
    } catch (err) {
      setError("An error occurred while updating your patient information. Please try again.");
      console.error("Error updating patient information:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemographicsSubmit = async ({ dateOfBirth, gender }: { dateOfBirth: Date | null; gender: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.updatePatient(fhirId!, {
        dateOfBirth: dateOfBirth?.toISOString().split("T")[0], // Convert to YYYY-MM-DD
        gender,
      });
      console.log("Update demographics response:", response);
      nextStep(fhirId!);
    } catch (err) {
      setError("An error occurred while updating your demographics information. Please try again.");
      console.error("Error updating demographics information:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLabResultsSubmit = async (file: File | null, testDate: Date | null) => {
    setLoading(true);
    setError(null);
    setProcessingState({
      uploadLabTest: "pending",
      interpretResults: "pending",
    });

    try {
      if (!file || !testDate) {
        throw new Error("Please select a file and test date");
      }

      if (fhirId) {
        setProcessingState((prev) => ({ ...prev, uploadLabTest: "loading" }));
        const uploadResponse = await adminService.uploadLabTestSet(fhirId, testDate, file);
        setProcessingState((prev) => ({ ...prev, uploadLabTest: "completed" }));

        if (!uploadResponse?.id) {
          throw new Error("Lab test upload succeeded but no lab set ID was returned");
        }

        setProcessingState((prev) => ({ ...prev, interpretResults: "loading" }));
        await adminService.interpretLabTestSet(uploadResponse.id);
        setProcessingState((prev) => ({ ...prev, interpretResults: "completed" }));

        navigate(`/patient/${fhirId}`);
      }
    } catch (err) {
      console.error("Error during process:", err);
      setProcessingState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "An unexpected error occurred during the process",
      }));
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "object" && err !== null) {
        setError(JSON.stringify(err));
      } else {
        setError("An unexpected error occurred during the process");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container title="Your AI-Powered Lab Interpreter" subtitle="Get instant insights from your lab results">
      {/* Current Step Indicator */}
      {currentStep !== "welcome" && (
        <div className="mb-4 text-center">
          <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
            {`Step
            ${
              currentStep === "account"
                ? "1"
                : currentStep === "name"
                ? "2"
                : currentStep === "demographics"
                ? "3"
                : "4"
            }
            of 4: ${getStepTitle(currentStep)}`}
          </span>
        </div>
      )}

      {/* Steps */}
      {currentStep === "welcome" && (
        <WelcomeStep
          onNext={() => {
            navigate("/wizard/account");
            setCurrentStep("account");
          }}
        />
      )}
      {currentStep === "account" && (
        <AccountStep
          onNext={handleEmailSubmit}
          onLogin={() => navigate("/login")}
          error={error || undefined}
          loading={loading}
        />
      )}
      {currentStep === "name" && <NameStep onNext={handleNameSubmit} onBack={() => prevStep(fhirId!)} />}
      {currentStep === "demographics" && (
        <DemographicsStep onNext={handleDemographicsSubmit} onBack={() => prevStep(fhirId!)} />
      )}
      {currentStep === "upload" && (
        <UploadStep
          onBack={() => navigate(`/patient/${fhirId}`)}
          onSubmit={(data) => handleLabResultsSubmit(data.file, data.date)}
          loading={loading}
          error={error || undefined}
          processingState={processingState}
        />
      )}
    </Container>
  );
}
