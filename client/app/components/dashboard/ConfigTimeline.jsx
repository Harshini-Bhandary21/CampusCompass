"use client";

import { CheckCircleIcon } from "@heroicons/react/24/solid";

export default function ConfigTimeline({ currentStep, onStepClick }) {
  const steps = [
    { id: 1, label: "Online Config" },
    { id: 2, label: "Faculty" },
    { id: 3, label: "Review" },
  ];

  const currentIndex = steps.findIndex((s) => s.id === currentStep);
  const displayStep = currentIndex >= 0 ? currentIndex + 1 : 1;

  return (
    <div className="bg-white rounded-xl border border-secondary p-6 mb-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-bold text-primary">
          Configuration Workflow
        </h3>
        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
          Step {displayStep} of {steps.length}
        </span>
      </div>

      <div className="flex items-start justify-between relative">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className="flex flex-col items-center flex-1 relative z-10"
          >
            <button
              onClick={() => onStepClick(step.id)}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full border-4 transition-all transform hover:scale-110 ${
                currentStep === step.id
                  ? "bg-primary border-white shadow-lg"
                  : currentStep > step.id
                    ? "bg-primary border-white shadow-md"
                    : "bg-white border-gray-300 shadow-sm"
              }`}
            >
              {currentStep > step.id ? (
                <CheckCircleIcon className="h-7 w-7 text-white" />
              ) : (
                <span
                  className={`text-sm font-bold ${currentStep === step.id ? "text-white" : "text-gray-400"}`}
                >
                  {step.id}
                </span>
              )}
              {currentStep === step.id && (
                <span className="absolute -inset-1 rounded-full bg-primary opacity-30 animate-ping"></span>
              )}
            </button>
            <p
              className={`text-xs font-semibold mt-2 text-center ${currentStep >= step.id ? "text-gray-800" : "text-gray-400"}`}
            >
              {step.label}
            </p>
            {idx < steps.length - 1 && (
              <div
                className="absolute left-1/2 right-0 top-6 h-1 -z-10"
                style={{ width: "calc(100% - 24px)", left: "calc(50% + 24px)" }}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentStep > step.id ? "bg-primary" : "bg-gray-300"
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
