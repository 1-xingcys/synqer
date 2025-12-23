"use client";

import { useCallback, useMemo } from "react";
import {
  CreateEventFormData,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  countCharacters,
  truncateToMaxChars,
} from "../types";

export function useTextFields(
  formData: CreateEventFormData,
  setFormData: React.Dispatch<React.SetStateAction<CreateEventFormData>>,
) {
  const titleCharCount = useMemo(
    () => countCharacters(formData.title),
    [formData.title],
  );

  const descriptionCharCount = useMemo(
    () => countCharacters(formData.description),
    [formData.description],
  );

  const updateTitle = useCallback(
    (value: string) => {
      const charCount = countCharacters(value);
      if (charCount <= TITLE_MAX_LENGTH) {
        setFormData((prev) => ({ ...prev, title: value }));
      } else {
        const truncated = truncateToMaxChars(value, TITLE_MAX_LENGTH);
        setFormData((prev) => ({ ...prev, title: truncated }));
      }
    },
    [setFormData],
  );

  const updateDescription = useCallback(
    (value: string) => {
      const charCount = countCharacters(value);
      if (charCount <= DESCRIPTION_MAX_LENGTH) {
        setFormData((prev) => ({ ...prev, description: value }));
      } else {
        const truncated = truncateToMaxChars(value, DESCRIPTION_MAX_LENGTH);
        setFormData((prev) => ({ ...prev, description: truncated }));
      }
    },
    [setFormData],
  );

  return {
    titleCharCount,
    descriptionCharCount,
    updateTitle,
    updateDescription,
  };
}
