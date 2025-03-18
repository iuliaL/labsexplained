import React, { useState } from "react";
import { NameStep } from "./NameStep";
import { DemographicsStep } from "./DemographicsStep";
import { UploadStep } from "./UploadStep";
import doctorImage from "../assets/supawork-medic.png";

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

  const WelcomeStep = () => (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Understand your lab results with AI</h2>
        <p className="text-slate-600 max-w-md mx-auto">
          Upload your lab results and get instant, personalized interpretations powered by advanced AI. Our system helps
          you understand your health data in plain language.
        </p>
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm">
          ✨ Free service - No credit card required
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-6">
          <div className="flex items-center text-slate-600">
            <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Quick analysis</span>
          </div>
          <div className="flex items-center text-slate-600">
            <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Easy to understand</span>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-6">
          <div className="flex items-center text-slate-600">
            <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Secure</span>
          </div>
          <div className="flex items-center text-slate-600">
            <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>24/7 Available</span>
          </div>
        </div>
      </div>

      <button
        onClick={nextStep}
        className="w-full max-w-sm mx-auto flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        Try It Now
      </button>
    </div>
  );

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
            {currentStep !== "welcome" && (
              <div className="mb-6 text-center">
                <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                  Step {currentStep === "name" ? "1" : currentStep === "demographics" ? "2" : "3"} of 3:&nbsp;
                  {getStepTitle(currentStep)}
                </span>
              </div>
            )}

            {/* Steps */}
            {currentStep === "welcome" && <WelcomeStep />}
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
