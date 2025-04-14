import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NameStep } from "./NameStep";
import { DemographicsStep } from "./DemographicsStep";
import { UploadStep } from "./UploadStep";
import { WelcomeStep } from "./WelcomeStep";
import { EmailStep } from "./EmailStep";
import { Login } from "./Login";
import doctorImage from "../../assets/supawork-medic.png";
import { UserIcon } from "../icons/UserIcon";
import { adminService } from "../../services/admin";

type Step = "welcome" | "email" | "name" | "demographics" | "upload";

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
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [isLoginMode, setIsLoginMode] = useState(false);
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
        nextPath = "/wizard/email";
        nextStepValue = "email";
        break;
      case "email":
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
      case "email":
        prevPath = "/wizard/";
        prevStepValue = "welcome";
        break;
      case "name":
        prevPath = "/wizard/email";
        prevStepValue = "email";
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
      case "email":
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
      const emailExists = await adminService.checkEmailExists(patientData.email);

      if (emailExists) {
        setIsLoginMode(true);
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

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    const genericLoginError = "An error occurred during login. Please try again.";

    try {
      const response = await adminService.login(patientData.email, patientData.password);
      if (response.fhir_id) {
        navigate(`/patient/${response.fhir_id}`);
      } else {
        setError(genericLoginError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : genericLoginError);
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
            <h1 className="text-3xl font-bold text-slate-900">Your AI-Powered Lab Interpreter</h1>
            <p className="mt-2 text-sm text-slate-600">Get instant insights from your lab results</p>
          </div>

          {/* Form Card */}
          <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
            {/* Current Step Indicator */}
            {currentStep !== "welcome" && (
              <div className="mb-4 text-center">
                <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                  {fhirId
                    ? "Upload new lab results"
                    : `Step ${
                        currentStep === "email"
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
            {currentStep === "email" && !isLoginMode && (
              <EmailStep
                email={patientData.email}
                password={patientData.password}
                onChange={(data) => setPatientData({ ...patientData, ...data })}
                onNext={handleEmailSubmit}
                onLogin={() => setIsLoginMode(true)}
                error={error || undefined}
              />
            )}
            {currentStep === "email" && isLoginMode && (
              <Login
                email={patientData.email}
                password={patientData.password}
                onChange={(data) => setPatientData({ ...patientData, ...data })}
                onSubmit={handleLogin}
                onBack={() => setIsLoginMode(false)}
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

      {error && (
        <div className="absolute top-4 right-4 bg-red-50 text-red-600 px-4 py-2 rounded-md shadow-sm">{error}</div>
      )}
    </div>
  );
}
