"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import type { CalendarDay } from "@/lib/calendarDay";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value: CalendarDay | null;
  onChange: (day: CalendarDay | null) => void;
  placeholder?: string;
  minDate?: CalendarDay;
  maxDate?: CalendarDay;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * react-day-picker speaks `Date`, so the local-midnight carrier representation
 * lives here and nowhere else. Anchoring at local *noon* keeps the Y/M/D digits
 * exact even in zones whose DST transition happens at midnight.
 */
function toPickerDate(day: CalendarDay): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date, 12);
}

function fromPickerDate(date: Date): CalendarDay {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  minDate,
  maxDate,
  disabled = false,
  className,
  ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = value ? toPickerDate(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ?? <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            onChange(date ? fromPickerDate(date) : null);
            setOpen(false);
          }}
          disabled={(date) => {
            const day = fromPickerDate(date);
            if (minDate && day < minDate) return true;
            if (maxDate && day > maxDate) return true;
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
