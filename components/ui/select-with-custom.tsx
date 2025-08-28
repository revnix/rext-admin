"use client";

import { Check, ChevronDown, Plus } from "lucide-react";
import * as React from "react";
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

export interface SelectWithCustomOption {
  label: string;
  value: string;
}

interface SelectWithCustomProps {
  options: SelectWithCustomOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allowCustom?: boolean;
  onCustomAdd?: (value: string) => void;
  emptyMessage?: string;
}

export function SelectWithCustom({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  className,
  allowCustom = true,
  onCustomAdd,
  emptyMessage = "No options found.",
}: SelectWithCustomProps) {
  const [open, setOpen] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");

  const handleCustomAdd = () => {
    if (
      customValue.trim() &&
      !options.some((opt) => opt.value === customValue.trim())
    ) {
      onChange(customValue.trim());
      if (onCustomAdd) {
        onCustomAdd(customValue.trim());
      }
      setCustomValue("");
      setOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && customValue.trim()) {
      event.preventDefault();
      handleCustomAdd();
    }
  };

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedOption ? selectedOption.label : value || placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or type custom value..."
            value={customValue}
            onValueChange={setCustomValue}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>
              {allowCustom && customValue.trim() ? (
                <div className="p-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleCustomAdd}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add "{customValue}"
                  </Button>
                </div>
              ) : (
                emptyMessage
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
