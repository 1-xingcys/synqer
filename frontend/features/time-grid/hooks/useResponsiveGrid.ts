"use client";

import { useState, useEffect } from "react";

interface ResponsiveGridConfig {
  datesPerPage: number;
  slotHeight: string;
  isMobile: boolean;
}

/**
 * 依視窗寬度計算 time grid 的響應式配置，
 * 提供每頁日期數、格高與是否 mobile 的單一來源。
 *
 * Responsive breakpoints configuration:
 * - < 400px: 5 dates, mobile height
 * - < 640px (sm): 5 dates, mobile height
 * - < 768px (md): 6 dates, desktop height
 * - >= 768px: 7 dates, desktop height
 */
export function useResponsiveGrid(): ResponsiveGridConfig {
  const [config, setConfig] = useState<ResponsiveGridConfig>({
    datesPerPage: 5,
    slotHeight: "2.5rem", // h-10 (mobile default)
    isMobile: false,
  });

  useEffect(() => {
    const calculateValues = () => {
      const width = window.innerWidth;
      // sm breakpoint is 640px
      const isMobile = width < 640;

      // Dates per page based on screen width
      let datesPerPage = 7;
      if (width < 400) datesPerPage = 5;
      else if (width < 640) datesPerPage = 5;
      else if (width < 768) datesPerPage = 6;
      else if (width < 1024) datesPerPage = 7;

      // Slot height: h-10 (2.5rem) on mobile, h-11 (2.75rem) on desktop
      const slotHeight = isMobile ? "2.5rem" : "2.75rem";

      setConfig({ datesPerPage, slotHeight, isMobile });
    };

    calculateValues();

    window.addEventListener("resize", calculateValues);
    return () => window.removeEventListener("resize", calculateValues);
  }, []);

  return config;
}
