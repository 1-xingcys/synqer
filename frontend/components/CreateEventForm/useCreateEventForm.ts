"use client";

import {
  useFormState,
  useTextFields,
  useDateTimeFields,
  useLineGroupFields,
  useFormValidation,
  useFormActions,
  type ValidationErrors,
} from "./hooks";
import { CreateEventFormData } from "./types";

interface UseCreateEventFormReturn {
  formData: CreateEventFormData;
  loading: boolean;
  validationErrors: ValidationErrors;
  // Field updates
  updateTitle: (value: string) => void;
  updateDescription: (value: string) => void;
  handleStartDateChange: (date: Date | null) => void;
  handleEndDateChange: (date: Date | null) => void;
  handleStartTimeChange: (value: string) => void;
  handleEndTimeChange: (value: string) => void;
  handleVotingDeadlineDateChange: (date: Date | null) => void;
  handleVotingDeadlineTimeChange: (value: string) => void;
  // LINE group
  handleLineGroupChange: (groupId: string | null) => void;
  handleSelectedMembersChange: (lineUserIds: string[]) => void;
  // Form actions
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleCancel: () => void;
  confirmCancel: () => void;
  cancelConfirmCancel: () => void;
  // Computed
  isFormValid: boolean;
  titleCharCount: number;
  descriptionCharCount: number;
  hasUnsavedChanges: boolean;
  showCancelConfirm: boolean;
}

export function useCreateEventForm(): UseCreateEventFormReturn {
  // Core state
  const {
    formData,
    setFormData,
    loading,
    setLoading,
    showCancelConfirm,
    setShowCancelConfirm,
  } = useFormState();

  // Text fields (title, description)
  const {
    titleCharCount,
    descriptionCharCount,
    updateTitle,
    updateDescription,
  } = useTextFields(formData, setFormData);

  // Date/time fields
  const {
    handleStartDateChange,
    handleEndDateChange,
    handleStartTimeChange,
    handleEndTimeChange,
    handleVotingDeadlineDateChange,
    handleVotingDeadlineTimeChange,
  } = useDateTimeFields(setFormData);

  // LINE group fields
  const { handleLineGroupChange, handleSelectedMembersChange } =
    useLineGroupFields(setFormData);

  // Validation
  const { validationErrors, isFormValid, hasUnsavedChanges } =
    useFormValidation(formData);

  // Form actions (submit, cancel)
  const { handleSubmit, handleCancel, confirmCancel, cancelConfirmCancel } =
    useFormActions({
      formData,
      hasUnsavedChanges,
      setLoading,
      setShowCancelConfirm,
    });

  return {
    formData,
    loading,
    validationErrors,
    updateTitle,
    updateDescription,
    handleStartDateChange,
    handleEndDateChange,
    handleStartTimeChange,
    handleEndTimeChange,
    handleVotingDeadlineDateChange,
    handleVotingDeadlineTimeChange,
    handleLineGroupChange,
    handleSelectedMembersChange,
    handleSubmit,
    handleCancel,
    confirmCancel,
    cancelConfirmCancel,
    isFormValid,
    titleCharCount,
    descriptionCharCount,
    hasUnsavedChanges,
    showCancelConfirm,
  };
}
