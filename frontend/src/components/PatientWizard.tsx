import React, { useState } from "react";
import { NameStep } from "./NameStep";
import { DemographicsStep } from "./DemographicsStep";
import { UploadStep } from "./UploadStep";
import { WelcomeStep } from "./WelcomeStep";
import doctorImage from "../assets/supawork-medic.png";
import { UserIcon } from "./icons/UserIcon";

type Step = "welcome" | "name" | "demographics" | "upload";

interface PatientData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  file?: File;
}

export default function PatientWizard() {
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [patientData, setPatientData] = useState<PatientData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
  });

  const nextStep = () => {
    if (currentStep === "welcome") setCurrentStep("name");
    else if (currentStep === "name") setCurrentStep("demographics");
    else if (currentStep === "demographics") setCurrentStep("upload");
  };

  const prevStep = () => {
    if (currentStep === "name") setCurrentStep("welcome");
    else if (currentStep === "demographics") setCurrentStep("name");
    else if (currentStep === "upload") setCurrentStep("demographics");
  };

  const getStepTitle = (step: Step) => {
    switch (step) {
      case "welcome":
        return "Welcome";
      case "name":
        return "Patient Information";
      case "demographics":
        return "Patient Demographics";
      case "upload":
        return "Upload Lab Results";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - Content */}
      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center px-4 sm:px-6 py-12">
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
            <div className="h-12 w-12 mx-auto text-blue-600 mb-5
            ">
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
                  Step {currentStep === "name" ? "1" : currentStep === "demographics" ? "2" : "3"} of 3:&nbsp;
                  {getStepTitle(currentStep)}
                </span>
              </div>
            )}

            {/* Steps */}
            {currentStep === "welcome" && <WelcomeStep onNext={nextStep} />}
            {currentStep === "name" && (
              <NameStep
                firstName={patientData.firstName}
                lastName={patientData.lastName}
                onChange={(data) => setPatientData({ ...patientData, ...data })}
                onNext={nextStep}
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
                onBack={prevStep}
                onSubmit={() => console.log("Submit:", patientData)}
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
    </div>
  );
}
