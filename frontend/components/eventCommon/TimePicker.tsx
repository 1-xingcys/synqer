"use client";

import * as React from "react";
import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  ChangeEvent,
} from "react";
import Picker from "react-mobile-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string | null;
  onChange: (value: string) => void;
  type?: "start" | "end";
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
  /** 當 value 為空時顯示的提示文字 */
  placeholder?: string;
}

// Hook to detect mobile device
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check for touch capability and screen size
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice && isSmallScreen);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export function TimePicker({
  value,
  onChange,
  type = "start",
  disabled = false,
  className,
  hasError = false,
  placeholder = "HH:MM",
}: TimePickerProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileTimePicker
        value={value}
        onChange={onChange}
        type={type}
        disabled={disabled}
        className={className}
        hasError={hasError}
        placeholder={placeholder}
      />
    );
  }

  return (
    <DesktopTimePicker
      value={value}
      onChange={onChange}
      type={type}
      disabled={disabled}
      className={className}
      hasError={hasError}
      placeholder={placeholder}
    />
  );
}

// Desktop Time Picker with input and dropdown
function DesktopTimePicker({
  value,
  onChange,
  type,
  disabled,
  className,
  hasError,
  placeholder = "HH:MM",
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Display value: use editValue when editing, otherwise use prop value (empty when null)
  const inputValue = isEditing ? editValue : (value ?? "");

  // Generate all valid time options
  const timeOptions = useMemo(() => {
    const options: string[] = [];

    if (type === "start") {
      // Start Time: 00:00 - 23:45
      for (let h = 0; h < 24; h++) {
        for (const m of [0, 15, 30, 45]) {
          options.push(
            `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
          );
        }
      }
    } else {
      // End Time: 00:15 - 24:00 with special rules
      // HH=00: only 15, 30, 45
      for (const m of [15, 30, 45]) {
        options.push(`00:${m.toString().padStart(2, "0")}`);
      }
      // HH=01-23: 00, 15, 30, 45
      for (let h = 1; h < 24; h++) {
        for (const m of [0, 15, 30, 45]) {
          options.push(
            `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
          );
        }
      }
      // HH=24: only 00
      options.push("24:00");
    }

    return options;
  }, [type]);

  // Validate time input
  const validateTime = useCallback(
    (timeStr: string): { valid: boolean; error?: string } => {
      // Check format HH:MM
      const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) {
        return { valid: false, error: "格式錯誤，請使用 HH:MM" };
      }

      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);

      // Check minute is valid (0, 15, 30, 45)
      if (![0, 15, 30, 45].includes(m)) {
        return { valid: false, error: "分鐘必須是 00、15、30 或 45" };
      }

      if (type === "start") {
        // Start: 00-23
        if (h < 0 || h > 23) {
          return { valid: false, error: "小時必須在 00-23 之間" };
        }
      } else {
        // End: 00-24 with rules
        if (h < 0 || h > 24) {
          return { valid: false, error: "小時必須在 00-24 之間" };
        }
        if (h === 0 && m === 0) {
          return {
            valid: false,
            error: "結束時間 00:00 無效，請選擇 00:15 以後",
          };
        }
        if (h === 24 && m !== 0) {
          return { valid: false, error: "24 時只能選擇 24:00" };
        }
      }

      return { valid: true };
    },
    [type],
  );

  // Handle input change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!isEditing) {
      setIsEditing(true);
    }
    setEditValue(newValue);

    // Clear error while typing
    if (inputError) {
      setInputError(null);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsEditing(true);
    setEditValue(value ?? "");
  };

  // Handle input blur - validate and apply
  const handleInputBlur = () => {
    // If we're not editing anymore (e.g. just selected from dropdown),
    // skip blur commit to avoid overwriting the latest selection.
    if (!isEditing) return;

    // Normalize input (add leading zero if needed)
    let normalizedValue = editValue.trim();

    // Try to fix common input patterns
    const shortMatch = normalizedValue.match(/^(\d):(\d{2})$/);
    if (shortMatch) {
      normalizedValue = `0${shortMatch[1]}:${shortMatch[2]}`;
    }

    const validation = validateTime(normalizedValue);
    if (validation.valid) {
      // Format to HH:MM
      const [h, m] = normalizedValue.split(":").map(Number);
      const formatted = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      onChange(formatted);
      setInputError(null);
    } else {
      setInputError(validation.error || "無效的時間");
    }
    // Exit editing mode
    setIsEditing(false);
  };

  // Handle option select from dropdown
  const handleOptionSelect = (time: string) => {
    onChange(time);
    setEditValue(time);
    setIsEditing(false);
    setInputError(null);
    setOpen(false);
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleInputBlur();
      setOpen(false);
    } else if (e.key === "Escape") {
      setEditValue(value ?? "");
      setIsEditing(false);
      setInputError(null);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              disabled={disabled}
              placeholder={placeholder}
              className={cn(
                "pr-16",
                (hasError || inputError) && "border-destructive",
                className,
              )}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-muted-foreground">
              <Clock className="h-4 w-4" />
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div
            className="max-h-60 overflow-y-auto"
            onMouseDown={(e) => {
              // Prevent input blur when clicking inside popover
              e.preventDefault();
            }}
          >
            {timeOptions.map((time) => (
              <button
                key={time}
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                  time === value &&
                    "bg-accent text-accent-foreground font-medium",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleOptionSelect(time)}
              >
                {time}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {inputError && (
        <p className="text-xs text-destructive mt-1">{inputError}</p>
      )}
    </div>
  );
}

// Mobile Time Picker with wheel
function MobileTimePicker({
  value,
  onChange,
  type,
  disabled,
  className,
  hasError,
  placeholder = "HH:MM",
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const [localPickerValue, setLocalPickerValue] = useState<{
    hour: string;
    minute: string;
  } | null>(null);

  // Parse current value from prop, falling back to a default for the wheel when empty
  const propValue = useMemo(() => {
    const [h, m] = (value ?? "00:00").split(":");
    return { hour: h, minute: m };
  }, [value]);

  // Use local value when editing (drawer open), otherwise use prop value
  const pickerValue = localPickerValue ?? propValue;

  // Reset local picker value when drawer opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalPickerValue(propValue);
    } else {
      setLocalPickerValue(null);
    }
    setOpen(isOpen);
  };

  // Setter that updates local picker value
  const setPickerValue = (
    newValue:
      | { hour: string; minute: string }
      | ((prev: { hour: string; minute: string }) => {
          hour: string;
          minute: string;
        }),
  ) => {
    if (typeof newValue === "function") {
      setLocalPickerValue((prev) => newValue(prev ?? propValue));
    } else {
      setLocalPickerValue(newValue);
    }
  };

  // Prevent page scroll when touching the picker
  useEffect(() => {
    const container = pickerContainerRef.current;
    if (!container || !open) return;

    const preventScroll = (e: TouchEvent) => {
      e.stopPropagation();
    };

    container.addEventListener("touchstart", preventScroll, { passive: true });
    container.addEventListener("touchmove", preventScroll, { passive: false });
    container.addEventListener("touchend", preventScroll, { passive: true });

    return () => {
      container.removeEventListener("touchstart", preventScroll);
      container.removeEventListener("touchmove", preventScroll);
      container.removeEventListener("touchend", preventScroll);
    };
  }, [open]);

  // Generate hour options based on type
  const hourOptions = useMemo(() => {
    if (type === "start") {
      return Array.from({ length: 24 }, (_, i) =>
        i.toString().padStart(2, "0"),
      );
    } else {
      return Array.from({ length: 25 }, (_, i) =>
        i.toString().padStart(2, "0"),
      );
    }
  }, [type]);

  // Generate minute options based on hour and type
  const getMinuteOptions = useCallback(
    (selectedHour: string) => {
      const h = parseInt(selectedHour, 10);

      if (type === "end") {
        if (h === 0) {
          return ["15", "30", "45"];
        } else if (h === 24) {
          return ["00"];
        }
      }
      return ["00", "15", "30", "45"];
    },
    [type],
  );

  const minuteOptions = useMemo(
    () => getMinuteOptions(pickerValue.hour),
    [pickerValue.hour, getMinuteOptions],
  );

  // Handle picker change
  const handlePickerChange = (
    newValue: { hour: string; minute: string },
    key: string,
  ) => {
    const updatedValue = { ...newValue };

    if (key === "hour") {
      const validMinutes = getMinuteOptions(newValue.hour);
      if (!validMinutes.includes(newValue.minute)) {
        updatedValue.minute = validMinutes[0];
      }
    }

    setPickerValue(updatedValue);
  };

  // Apply the selection
  const handleConfirm = () => {
    const newTime = `${pickerValue.hour}:${pickerValue.minute}`;
    onChange(newTime);
    setLocalPickerValue(null);
    setOpen(false);
  };

  // Format display value - always use prop value for display
  const displayValue = value ?? placeholder;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            value == null && "text-muted-foreground",
            hasError && "border-destructive",
            className,
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <div
            ref={pickerContainerRef}
            className="touch-none"
            onTouchMove={(e) => e.stopPropagation()}
          >
            <Picker
              value={pickerValue}
              onChange={handlePickerChange}
              wheelMode="natural"
              height={180}
            >
              <Picker.Column name="hour">
                {hourOptions.map((h) => (
                  <Picker.Item key={h} value={h}>
                    {({ selected }) => (
                      <div
                        className={cn(
                          "text-center py-1 text-lg",
                          selected
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {h}
                      </div>
                    )}
                  </Picker.Item>
                ))}
              </Picker.Column>
              <Picker.Column name="minute">
                {minuteOptions.map((m) => (
                  <Picker.Item key={m} value={m}>
                    {({ selected }) => (
                      <div
                        className={cn(
                          "text-center py-1 text-lg",
                          selected
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {m}
                      </div>
                    )}
                  </Picker.Item>
                ))}
              </Picker.Column>
            </Picker>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
