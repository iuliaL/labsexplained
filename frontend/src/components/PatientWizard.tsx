import React, { useState } from "react";
import { NameStep } from "./NameStep";
import { DemographicsStep } from "./DemographicsStep";
import { UploadStep } from "./UploadStep";
import doctorImage from "../assets/supawork-medic.png";

type Step = "name" | "demographics" | "upload";

interface PatientData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  file?: File;
}

export default function PatientWizard() {
  const [currentStep, setCurrentStep] = useState<Step>("name");
  const [patientData, setPatientData] = useState<PatientData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
  });

  const nextStep = () => {
    if (currentStep === "name") setCurrentStep("demographics");
    else if (currentStep === "demographics") setCurrentStep("upload");
  };

  const prevStep = () => {
    if (currentStep === "demographics") setCurrentStep("name");
    else if (currentStep === "upload") setCurrentStep("demographics");
  };

  const getStepTitle = (step: Step) => {
    switch (step) {
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
          <div className="text-center mb-8">
            <div className="h-12 w-12 mx-auto text-blue-600 mb-6">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2L12,2c-3.3,0-6,2.7-6,6v2c0,3.3,2.7,6,6,6h0c3.3,0,6-2.7,6-6V8C18,4.7,15.3,2,12,2z" />
                <path d="M12,16c-4.4,0-8,3.6-8,8h16C20,19.6,16.4,16,12,16z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Your AI-Powered Lab Interpreter</h1>
            <p className="mt-2 text-sm text-slate-600">Get instant insights from your lab results</p>
          </div>

          {/* Form Card */}
          <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
            {/* Current Step Indicator */}
            <div className="mb-6 text-center">
              <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                Step {currentStep === "name" ? "1" : currentStep === "demographics" ? "2" : "3"} of 3:&nbsp;
                {getStepTitle(currentStep)}
              </span>
            </div>

            {/* Form Steps */}
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
      <div className="hidden lg:block w-1/2 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <img src={doctorImage} alt="Medical Professional" className="h-screen w-auto object-contain" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/80 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
