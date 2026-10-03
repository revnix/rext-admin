"use client";

import { Check, ChevronDown, X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
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
import type { SelectOption } from "@/types/shared";

interface MultiSelectProps {
  options: SelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  allowCustom?: boolean;
  onCustomAdd?: (value: string) => void;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
  allowCustom = false,
  onCustomAdd,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  const handleSelect = (item: string) => {
    if (selected.includes(item)) {
      handleUnselect(item);
    } else {
      onChange([...selected, item]);
    }
  };

  const handleCustomAdd = () => {
    if (customValue.trim() && !selected.includes(customValue.trim())) {
      onChange([...selected, customValue.trim()]);
      if (onCustomAdd) {
        onCustomAdd(customValue.trim());
      }
      setCustomValue("");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && customValue.trim()) {
      event.preventDefault();
      handleCustomAdd();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between min-h-9 h-auto", className)}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length > 0 ? (
              selected.map((item) => {
                const option = options.find((opt) => opt.value === item);
                return (
                  <Badge
                    variant="default"
                    key={item}
                    className="mr-1 mb-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(item);
                    }}
                  >
                    {option?.label || item}
                    <X className="ml-1 h-3 w-3 cursor-pointer" />
                  </Badge>
                );
              })
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search options..."
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
                    Add "{customValue}"
                  </Button>
                </div>
              ) : (
                "No options found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className={cn(
                    selected.includes(option.value)
                      ? "bg-primary/10 text-primary"
                      : "",
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value)
                        ? "opacity-100 text-foreground"
                        : "opacity-0",
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
