import { useAuth } from "@contexts/AuthContext";
import { usePersistentWizard } from "@hooks/persistWizardState";
import { adminService } from "@services/admin";
import { authService } from "@services/auth";
import Container from "@ui/Container";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AccountStep } from "./AccountStep";
import { DemographicsStep } from "./DemographicsStep";
import { NameStep } from "./NameStep";
import { UploadStep } from "./UploadStep";
import { WelcomeStep } from "./WelcomeStep";
type Step = "welcome" | "account" | "name" | "demographics" | "upload";

interface ProcessingState {
  createPatient: "pending" | "loading" | "completed" | "error";
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

  const { currentStep, setCurrentStep, patientData, setPatientData, clearWizardState } =
    usePersistentWizard(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    createPatient: "pending",
    uploadLabTest: "pending",
    interpretResults: "pending",
  });

  useEffect(() => {
    // If we have a FHIR ID and we're on the upload step, fetch the patient's data
    if (fhirId && currentStep === "upload") {
      adminService.getPatient(fhirId).then((patient) => {
        setPatientData({
          ...patientData,
          firstName: patient.first_name,
          lastName: patient.last_name,
          dateOfBirth: patient.birth_date,
          gender: patient.gender,
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fhirId, currentStep]);

  useEffect(() => {
    setCurrentStep(initialStep);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStep]);

  const nextStep = () => {
    let nextPath = "/wizard/";
    let nextStepValue: Step = "welcome";

    switch (currentStep) {
      case "welcome":
        nextPath = "/wizard/account";
        nextStepValue = "account";
        break;
      case "account":
        nextPath = "/wizard/name";
        nextStepValue = "name";
        break;
      case "name":
        nextPath = "/wizard/demographics";
        nextStepValue = "demographics";
        break;
      case "demographics":
        nextPath = "/wizard/upload";
        nextStepValue = "upload";
        break;
    }

    setCurrentStep(nextStepValue);
    navigate(nextPath);
  };

  const prevStep = () => {
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
        prevPath = "/wizard/name";
        prevStepValue = "name";
        break;
      case "upload":
        prevPath = "/wizard/demographics";
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

  const handleEmailSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if email exists
      const emailExists = await authService.checkEmailExists(patientData.email);

      if (emailExists) {
        setError("Email already exists. Please log in instead.");
      } else {
        nextStep();
      }
    } catch (err) {
      console.error("Error checking email:", err);
      setError("An error occurred while checking your email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLabResultsSubmit = async () => {
    setLoading(true);
    setError(null);
    setProcessingState({
      createPatient: fhirId ? "completed" : "loading",
      uploadLabTest: "pending",
      interpretResults: "pending",
    });

    try {
      if (!patientData.file || !patientData.testDate) {
        throw new Error("Please select a file and test date");
      }

      if (fhirId) {
        // If we have a FHIR ID, we're just uploading new lab results to an existing patient
        setProcessingState((prev) => ({ ...prev, uploadLabTest: "loading" }));
        const uploadResponse = await adminService.uploadLabTestSet(fhirId, patientData.testDate, patientData.file);
        setProcessingState((prev) => ({ ...prev, uploadLabTest: "completed" }));

        if (!uploadResponse?.id) {
          throw new Error("Lab test upload succeeded but no lab set ID was returned");
        }

        setProcessingState((prev) => ({ ...prev, interpretResults: "loading" }));
        await adminService.interpretLabTestSet(uploadResponse.id);
        setProcessingState((prev) => ({ ...prev, interpretResults: "completed" }));
        clearWizardState(); // Clear the wizard state (local storage) after the process is complete

        navigate(`/patient/${fhirId}`);
      } else {
        // Create a new patient and upload their first lab set
        setProcessingState((prev) => ({ ...prev, createPatient: "loading" }));
        const { fhir_id } = await adminService.createPatient({
          email: patientData.email,
          password: patientData.password,
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          dateOfBirth: patientData.dateOfBirth,
          gender: patientData.gender,
        });
        setProcessingState((prev) => ({ ...prev, createPatient: "completed" }));

        if (!fhir_id) {
          throw new Error("Patient creation succeeded but no FHIR ID was returned");
        }

        // Update auth context with the new user's data
        await login(patientData.email, patientData.password);

        setProcessingState((prev) => ({ ...prev, uploadLabTest: "loading" }));
        const uploadResponse = await adminService.uploadLabTestSet(
          fhir_id,
          patientData.testDate || new Date().toISOString().split("T")[0],
          patientData.file
        );
        setProcessingState((prev) => ({ ...prev, uploadLabTest: "completed" }));

        if (!uploadResponse?.id) {
          throw new Error("Lab test upload succeeded but no lab set ID was returned");
        }

        setProcessingState((prev) => ({ ...prev, interpretResults: "loading" }));
        await adminService.interpretLabTestSet(uploadResponse.id);
        setProcessingState((prev) => ({ ...prev, interpretResults: "completed" }));
        clearWizardState(); // Clear the wizard state (local storage) after the process is complete

        // Navigate to the patient dashboard
        navigate(`/patient/${fhir_id}`);
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
            {fhirId
              ? "Upload new lab results"
              : `Step ${
                  currentStep === "account"
                    ? "1"
                    : currentStep === "name"
                    ? "2"
                    : currentStep === "demographics"
                    ? "3"
                    : "4"
                } of 4: ${getStepTitle(currentStep)}`}
          </span>
        </div>
      )}

      {/* Steps */}
      {currentStep === "welcome" && <WelcomeStep onNext={nextStep} />}
      {currentStep === "account" && (
        <AccountStep
          email={patientData.email}
          password={patientData.password}
          onChange={(data) => setPatientData({ ...patientData, ...data })}
          onNext={handleEmailSubmit}
          onLogin={() => navigate("/login")}
          error={error || undefined}
          loading={loading}
        />
      )}
      {currentStep === "name" && (
        <NameStep
          firstName={patientData.firstName}
          lastName={patientData.lastName}
          onChange={(data) => setPatientData({ ...patientData, ...data })}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {currentStep === "demographics" && (
        <DemographicsStep
          dateOfBirth={patientData.dateOfBirth ? new Date(patientData.dateOfBirth) : null}
          gender={patientData.gender}
          onChange={({ gender, dateOfBirth }) =>
            setPatientData((prevPatientData) => {
              return {
                ...prevPatientData,
                gender,
                dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : "",
              };
            })
          }
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {currentStep === "upload" && (
        <UploadStep
          onFileSelect={(file) => {
            setPatientData((prevPatientData) => ({ ...prevPatientData, file }));
          }}
          onDateSelect={(date) => {
            setPatientData((prevPatientData) => ({ ...prevPatientData, testDate: date ? date.toISOString() : "" }));
          }}
          onBack={fhirId ? () => navigate(`/patient/${fhirId}`) : prevStep}
          onSubmit={handleLabResultsSubmit}
          initialDate={patientData.testDate ? new Date(patientData.testDate) : null}
          initialFile={patientData.file}
          loading={loading}
          error={error || undefined}
          processingState={processingState}
          isUploadOnly={!!fhirId}
        />
      )}
    </Container>
  );
}
