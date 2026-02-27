"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useFormState } from "./hooks/useFormState";
import { useFormValidation } from "./hooks/useFormValidation";
import { useFormActions } from "./hooks/useFormActions";

// =============================================================================
// Context - only store core state
// =============================================================================

function useCreateEventFormContextValue() {
  const formState = useFormState();
  const { errors, hasUnsavedChanges } = useFormValidation(formState.formData);
  const formActions = useFormActions({
    formData: formState.formData,
    hasUnsavedChanges,
    setLoading: formState.setLoading,
    setShowCancelConfirm: formState.setShowCancelConfirm,
  });

  return {
    state: {
      formData: formState.formData,
      setFormData: formState.setFormData,
      loading: formState.loading,
      setLoading: formState.setLoading,
      showCancelConfirm: formState.showCancelConfirm,
      setShowCancelConfirm: formState.setShowCancelConfirm,
    },
    validation: {
      errors,
      hasUnsavedChanges,
    },
    actions: {
      handleSubmit: formActions.handleSubmit,
      handleCancel: formActions.handleCancel,
      confirmCancel: formActions.confirmCancel,
      cancelConfirmCancel: formActions.cancelConfirmCancel,
    },
  };
}

type FormStateContextType = ReturnType<typeof useCreateEventFormContextValue>;

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
  const formState = useCreateEventFormContextValue();

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
