"use client";

import { useState } from "react";
import { CreateEventFormData, initialFormData } from "../types";

export function useFormState() {
  const [formData, setFormData] =
    useState<CreateEventFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  return {
    formData,
    setFormData,
    loading,
    setLoading,
    showCancelConfirm,
    setShowCancelConfirm,
  };
}
