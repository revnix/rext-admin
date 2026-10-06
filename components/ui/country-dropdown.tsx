"use client";

import type React from "react";
import { useCallback, forwardRef, useMemo, useState } from "react";
// shadcn
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

// utils
import { cn } from "@/lib/utils";

// icons
import { ChevronDown, CheckIcon, Globe } from "lucide-react";
import { CircleFlag } from "react-circle-flags";

// data
import { countries } from "country-data-list";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface Country {
  alpha2: string;
  alpha3: string;
  countryCallingCodes: string[];
  currencies: string[];
  emoji?: string;
  ioc: string;
  languages: string[];
  name: string;
  status: string;
}

const GLOBAL_COUNTRY: Country = {
  alpha2: "global",
  alpha3: "GLB",
  countryCallingCodes: [],
  currencies: [],
  name: "Global",
  status: "assigned",
  ioc: "GLB",
  languages: [],
};

interface CountryDropdownProps {
  options?: Country[];
  value?: string; // ISO-2 ("US") or ISO-3 ("USA")
  onChange?: (country: Country) => void;
  disabled?: boolean;
  placeholder?: string;
  slim?: boolean;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

const CountryDropdownComponent = (
  {
    options = [
      GLOBAL_COUNTRY,
      ...countries.all.filter(
        (country: Country) =>
          country.emoji &&
          country.status !== "deleted" &&
          country.ioc !== "PRK",
      ),
    ],
    value,
    onChange,
    disabled = false,
    placeholder = "Select a country",
    slim = false,
    ...props
  }: CountryDropdownProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) => {
  const [open, setOpen] = useState(false);

  /* -------------------------------------------------------------- */
  /* Derived selected country (controlled)                           */
  /* -------------------------------------------------------------- */

  const selectedCountry = useMemo(() => {
    if (!value) return undefined;

    return options.find(
      (c) =>
        c.alpha2.toLowerCase() === value.toLowerCase() ||
        c.alpha3.toLowerCase() === value.toLowerCase(),
    );
  }, [value, options]);

  /* -------------------------------------------------------------- */
  /* Handlers                                                       */
  /* -------------------------------------------------------------- */

  const handleSelect = useCallback(
    (country: Country) => {
      onChange?.(country);
      setOpen(false);
    },
    [onChange],
  );

  // Slim: the flag alone; otherwise the flag and the country's name, as wide as the row allows.
  const triggerClasses = cn(
    "flex h-10 items-center justify-between gap-2 whitespace-nowrap rounded-md bg-transparent px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 cursor-pointer",
    slim ? "w-20" : "w-full sm:w-48",
  );

  /* -------------------------------------------------------------- */
  /* Render                                                        */
  /* -------------------------------------------------------------- */

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={ref}
        className={triggerClasses}
        disabled={disabled}
        {...props}
      >
        {selectedCountry ? (
          <div className="flex items-center flex-grow w-0 gap-2 overflow-hidden">
            <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
              {selectedCountry.alpha2 === "global" ? (
                <Globe size={18} className="text-foreground" />
              ) : (
                <CircleFlag
                  countryCode={selectedCountry.alpha2.toLowerCase()}
                  height={20}
                />
              )}
            </div>

            {!slim && (
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {selectedCountry.name}
              </span>
            )}
          </div>
        ) : (
          <span>{!slim ? placeholder : <Globe size={18} />}</span>
        )}

        <ChevronDown size={16} />
      </PopoverTrigger>

      <PopoverContent
        collisionPadding={10}
        side="bottom"
        className="min-w-[--radix-popper-anchor-width] p-0"
      >
        <Command className="w-full max-h-[200px] sm:max-h-[270px]">
          <CommandList>
            <div className="sticky top-0 z-10 bg-popover">
              <CommandInput placeholder="Search country..." />
            </div>

            <CommandEmpty>No country found.</CommandEmpty>

            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={`${option.alpha2}-${option.name}`}
                  className="flex items-center w-full gap-2"
                  onSelect={() => handleSelect(option)}
                >
                  <div className="flex flex-grow w-0 space-x-2 overflow-hidden">
                    <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
                      {option.alpha2 === "global" ? (
                        <Globe size={18} className="text-foreground" />
                      ) : (
                        <CircleFlag
                          countryCode={option.alpha2.toLowerCase()}
                          height={20}
                        />
                      )}
                    </div>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {option.name}
                    </span>
                  </div>

                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0",
                      option.alpha2 === selectedCountry?.alpha2
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

CountryDropdownComponent.displayName = "CountryDropdown";

export const CountryDropdown = forwardRef(CountryDropdownComponent);
