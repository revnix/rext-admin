"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { type Ref, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Every IANA timezone the browser knows, UTC first (some engines leave it out of the list). */
function timeZones(): string[] {
  const known = Intl.supportedValuesOf("timeZone");
  return ["UTC", ...known.filter((zone) => zone !== "UTC")];
}

function label(zone: string) {
  return zone.replaceAll("_", " ");
}

/**
 * A timezone picked from a searchable list (design/app-language.md §6's Combobox, built from the
 * Popover and Command primitives): over 400 names are too many for a Select. Takes a
 * FieldController's binding.
 */
export function TimezoneSelect({
  ref,
  value,
  onChange,
  onBlur,
  disabled,
  ...trigger
}: {
  ref?: Ref<HTMLButtonElement>;
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [open, setOpen] = useState(false);
  const zones = useMemo(timeZones, []);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
          {...trigger}
        >
          <span className="truncate">
            {value ? label(value) : "Choose a timezone"}
          </span>
          <ChevronsUpDown className="opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command>
          <CommandInput placeholder="Search by city or region" />
          <CommandList>
            <CommandEmpty>No timezone matches that.</CommandEmpty>
            <CommandGroup>
              {zones.map((zone) => (
                <CommandItem
                  key={zone}
                  value={label(zone)}
                  onSelect={() => {
                    onChange(zone);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(zone === value ? "opacity-100" : "opacity-0")}
                    aria-hidden
                  />
                  {label(zone)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
