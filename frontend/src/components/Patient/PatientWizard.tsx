import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NameStep } from "./NameStep";
import { DemographicsStep } from "./DemographicsStep";
import { UploadStep } from "./UploadStep";
import { WelcomeStep } from "./WelcomeStep";
import { AccountStep } from "./AccountStep";
import Container from "../ui/Container";
import { adminService } from "../../services/admin";
import { authService } from "../../services/auth";
import { useAuth } from "../../contexts/AuthContext";

type Step = "welcome" | "account" | "name" | "demographics" | "upload";

interface PatientData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  file?: File;
  testDate?: string;
}

interface PatientWizardProps {
  initialStep?: Step;
}

export default function PatientWizard({ initialStep = "welcome" }: PatientWizardProps) {
  const navigate = useNavigate();
  const { fhirId } = useParams<{ fhirId: string }>();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [patientData, setPatientData] = useState<PatientData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (fhirId) {
        // If we have a FHIR ID, we're adding a new lab set to an existing patient
        if (!patientData.file || !patientData.testDate) {
          throw new Error("Please select a file and test date");
        }
        await adminService.uploadLabTestSet(fhirId, patientData.testDate, patientData.file);
        navigate(`/patient/${fhirId}`);
      } else {
        // Create a new patient and upload their first lab set
        const { fhir_id, message } = await adminService.createPatient({
          email: patientData.email,
          password: patientData.password,
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          dateOfBirth: patientData.dateOfBirth,
          gender: patientData.gender,
        });
        console.log("Patient created successfully:", { fhir_id, message });

        if (!fhir_id) {
          throw new Error("Patient creation succeeded but no FHIR ID was returned");
        }

        // Update auth context with the new user's data
        await login(patientData.email, patientData.password);

        console.log("Starting lab test upload for patient:", fhir_id);
        // Step 2: Upload the lab test set
        const uploadResponse = await adminService.uploadLabTestSet(
          fhir_id,
          patientData.testDate || new Date().toISOString().split("T")[0],
          patientData.file!
        );
        console.log("Lab test upload response:", uploadResponse);

        if (!uploadResponse?.id) {
          throw new Error("Lab test upload succeeded but no lab set ID was returned");
        }

        console.log("Starting interpretation for lab set:", uploadResponse.id);
        // Step 3: Generate interpretation
        await adminService.interpretLabTestSet(uploadResponse.id);
        // Navigate to the patient dashboard
        navigate(`/patient/${fhir_id}`);
      }
    } catch (err) {
      console.error("Error during process:", err);
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
          dateOfBirth={patientData.dateOfBirth}
          gender={patientData.gender}
          onChange={(data) => setPatientData({ ...patientData, ...data })}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {currentStep === "upload" && (
        <UploadStep
          onFileSelect={(file) => setPatientData({ ...patientData, file })}
          onDateSelect={(date) => setPatientData({ ...patientData, testDate: date })}
          onBack={fhirId ? () => navigate(`/patient/${fhirId}`) : prevStep}
          onSubmit={handleSubmit}
          initialDate={patientData.testDate}
          initialFile={patientData.file}
          loading={loading}
        />
      )}
    </Container>
  );
}
