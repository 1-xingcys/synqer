"use client";

import { useCallback, useMemo } from "react";
import { CreateEventFormData, TITLE_MAX_LENGTH } from "../types";

function countCharacters(str: string): number {
  return str.length;
}

function truncateToMaxChars(str: string, maxChars: number): string {
  if (str.length <= maxChars) {
    return str;
  }
  return str.slice(0, maxChars);
}

export function useTextFields(
  formData: CreateEventFormData,
  setFormData: React.Dispatch<React.SetStateAction<CreateEventFormData>>,
) {
  const titleCharCount = useMemo(
    () => countCharacters(formData.title),
    [formData.title],
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

  return {
    titleCharCount,
    updateTitle,
  };
}
