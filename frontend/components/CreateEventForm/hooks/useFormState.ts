"use client";

import { useState } from "react";
import { CreateEventFormData, getInitialFormData } from "../types";

export function useFormState() {
  const [formData, setFormData] = useState<CreateEventFormData>(() =>
    getInitialFormData(),
  );
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
