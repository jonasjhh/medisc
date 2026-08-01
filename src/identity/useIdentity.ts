import { createContext, useContext } from "react";
import type { IdentityUser } from "./api";

export type OnboardingStep = "welcome" | "claim";

export interface IdentityContextValue {
  status: "loading" | "ready";
  user: IdentityUser | null;
  isOnboardingOpen: boolean;
  onboardingStep: OnboardingStep;
  openOnboarding: (step?: OnboardingStep) => void;
  closeOnboarding: () => void;
  applyUser: (user: IdentityUser) => void;
}

export const IdentityContext = createContext<IdentityContextValue | null>(null);

export function useIdentity(): IdentityContextValue {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error("useIdentity must be used within an IdentityProvider");
  }
  return context;
}
