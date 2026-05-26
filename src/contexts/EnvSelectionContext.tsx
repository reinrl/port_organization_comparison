import { createContext, useContext, useState } from "react";
import { envNames, displayNames } from "../util/configs.ts";

interface EnvOption {
  envName: string;
  displayName: string;
}

interface EnvSelectionContextValue {
  sourceEnv: string;
  destEnv: string;
  setSourceEnv: (env: string) => void;
  setDestEnv: (env: string) => void;
  availableEnvs: EnvOption[];
}

const EnvSelectionContext = createContext<EnvSelectionContextValue | null>(null);

function resolveStoredEnv(storageKey: string, fallback: string): string {
  const stored = localStorage.getItem(storageKey);
  if (stored && envNames.includes(stored)) return stored;
  return fallback;
}

export function EnvSelectionProvider({ children }: { children: React.ReactNode }) {
  const [sourceEnv, setSourceEnvState] = useState<string>(() =>
    resolveStoredEnv("selectedSourceEnv", envNames[0] ?? "")
  );
  const [destEnv, setDestEnvState] = useState<string>(() =>
    resolveStoredEnv("selectedDestEnv", envNames[envNames.length - 1] ?? envNames[0] ?? "")
  );

  const setSourceEnv = (env: string) => {
    setSourceEnvState(env);
    localStorage.setItem("selectedSourceEnv", env);
  };

  const setDestEnv = (env: string) => {
    setDestEnvState(env);
    localStorage.setItem("selectedDestEnv", env);
  };

  const availableEnvs: EnvOption[] = envNames.map((name) => ({
    envName: name,
    displayName: displayNames[name] ?? name,
  }));

  return (
    <EnvSelectionContext.Provider
      value={{ sourceEnv, destEnv, setSourceEnv, setDestEnv, availableEnvs }}
    >
      {children}
    </EnvSelectionContext.Provider>
  );
}

export function useEnvSelection(): EnvSelectionContextValue {
  const ctx = useContext(EnvSelectionContext);
  if (!ctx) throw new Error("useEnvSelection must be used within EnvSelectionProvider");
  return ctx;
}
