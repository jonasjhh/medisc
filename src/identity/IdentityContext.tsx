import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCurrentUser } from "./api";
import type { IdentityUser } from "./api";
import { useInstallPromptContext } from "../app/InstallPromptContext";

const DISMISSED_KEY = "medisc-welcome-dismissed";

export type OnboardingStep = "welcome" | "claim";

interface IdentityContextValue {
  status: "loading" | "ready";
  user: IdentityUser | null;
  isOnboardingOpen: boolean;
  onboardingStep: OnboardingStep;
  openOnboarding: (step?: OnboardingStep) => void;
  closeOnboarding: () => void;
  applyUser: (user: IdentityUser) => void;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const { canInstall } = useInstallPromptContext();
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [user, setUser] = useState<IdentityUser | null>(null);
  // Distinguishes "the server confirmed there's no user yet" from "we
  // couldn't reach the server at all" — only the former should trigger the
  // onboarding modal. A network hiccup must never block the rest of the app.
  const [fetchFailed, setFetchFailed] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] =
    useState<OnboardingStep>("welcome");

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then(({ user: fetched }) => {
        if (cancelled) return;
        setUser(fetched);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setFetchFailed(true);
        setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Defer to the install prompt when it's on offer — never show both
    // first-run overlays at once. Once it's dismissed or acted on,
    // `canInstall` flips to false and this effect re-runs.
    if (status !== "ready" || user !== null || fetchFailed || canInstall) {
      return;
    }
    if (localStorage.getItem(DISMISSED_KEY)) return;
    setOnboardingStep("welcome");
    setIsOnboardingOpen(true);
  }, [status, user, fetchFailed, canInstall]);

  const closeOnboarding = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setIsOnboardingOpen(false);
  };

  const openOnboarding = (step: OnboardingStep = "welcome") => {
    setOnboardingStep(step);
    setIsOnboardingOpen(true);
  };

  const value = useMemo(
    () => ({
      status,
      user,
      isOnboardingOpen,
      onboardingStep,
      openOnboarding,
      closeOnboarding,
      applyUser: setUser,
    }),
    [status, user, isOnboardingOpen, onboardingStep],
  );

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity(): IdentityContextValue {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error("useIdentity must be used within an IdentityProvider");
  }
  return context;
}
