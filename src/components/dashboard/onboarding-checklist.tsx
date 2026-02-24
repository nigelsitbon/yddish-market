"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Circle,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";

type Step = {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  href: string;
};

type OnboardingData = {
  steps: Step[];
  completedCount: number;
  totalSteps: number;
  allComplete: boolean;
  progress: number;
};

export function OnboardingChecklist() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check localStorage for dismissal
    const wasDismissed = localStorage.getItem("yddish_onboarding_dismissed");
    if (wasDismissed === "true") {
      setDismissed(true);
      setLoading(false);
      return;
    }

    fetch("/api/dashboard/onboarding-status")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
          // Auto-dismiss if all complete
          if (json.data.allComplete) {
            localStorage.setItem("yddish_onboarding_dismissed", "true");
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("yddish_onboarding_dismissed", "true");
  };

  if (loading || dismissed || !data || data.allComplete) return null;

  const nextStep = data.steps.find((s) => !s.completed);

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="relative px-6 py-5 bg-gradient-to-r from-accent/5 via-accent/8 to-accent/5 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Sparkles size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="text-[15px] font-medium text-foreground">
                Lancez votre boutique
              </h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {data.completedCount}/{data.totalSteps} étapes complétées
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-border/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent/80 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${data.progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-border/50">
        {data.steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className={`flex items-center gap-4 px-6 py-4 transition-all duration-200 group ${
              step.completed
                ? "opacity-60 hover:opacity-80"
                : "hover:bg-muted/30"
            }`}
          >
            {/* Check icon */}
            <div className="shrink-0">
              {step.completed ? (
                <CheckCircle size={20} className="text-success" />
              ) : step.id === nextStep?.id ? (
                <div className="relative">
                  <Circle size={20} className="text-accent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  </div>
                </div>
              ) : (
                <Circle size={20} className="text-border" />
              )}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-[13px] ${
                  step.completed
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {step.label}
              </p>
              {!step.completed && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              )}
            </div>

            {/* Arrow for next step */}
            {!step.completed && (
              <ArrowRight
                size={14}
                className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0"
              />
            )}
          </Link>
        ))}
      </div>

      {/* CTA for next step */}
      {nextStep && (
        <div className="px-6 py-4 bg-muted/30 border-t border-border/50">
          <Link
            href={nextStep.href}
            className="inline-flex items-center gap-2 h-10 px-5 btn-gradient-dark text-[#FFFFFF] text-[12px] tracking-wide rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            {nextStep.label}
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
