"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useFormState } from "./hooks/useFormState";

// =============================================================================
// Context - only store core state
// =============================================================================

type FormStateContextType = ReturnType<typeof useFormState>;

const FormStateContext = createContext<FormStateContextType | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface CreateEventFormProviderProps {
  children: ReactNode;
}

export function CreateEventFormProvider({
  children,
}: CreateEventFormProviderProps) {
  const formState = useFormState();

  return (
    <FormStateContext.Provider value={formState}>
      {children}
    </FormStateContext.Provider>
  );
}

// =============================================================================
// Hook - get core state
// =============================================================================

export function useFormStateContext() {
  const context = useContext(FormStateContext);

  if (!context) {
    throw new Error(
      "useFormStateContext must be used within a CreateEventFormProvider",
    );
  }

  return context;
}
