// components/ui/date-picker.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  selected: Date;
  onSelect: (date: Date) => void;
  disabled?: { before?: Date; after?: Date };
  locale?: Locale;
  placeholderText?: string;
}

export function DatePicker({
  selected,
  onSelect,
  disabled,
  locale = es,
  placeholderText = "Seleccionar fecha",
}: DatePickerProps) {
  const today = new Date();
  
  // Get the next 3 months as max date
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-white",
            !selected && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? (
            format(selected, "EEEE, d MMMM yyyy", { locale })
          ) : (
            <span>{placeholderText}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => date && onSelect(date)}
          disabled={{ before: today, ...disabled }}
          fromDate={today}
          toDate={maxDate}
          locale={locale}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}