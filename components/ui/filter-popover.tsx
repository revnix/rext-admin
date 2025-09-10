"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type {
  ColumnFilter,
  FilterOperator,
  FilterValue,
} from "@/types/data-table";

interface FilterPopoverProps<T extends Record<string, unknown>> {
  column: {
    key: string;
    header: string;
    filterType?: "text" | "number" | "date" | "boolean" | "array" | "select";
    filterOptions?: string[];
  };
  data: T[];
  currentFilter?: ColumnFilter;
  onApplyFilter: (filter: ColumnFilter | null) => void;
  children: React.ReactNode;
}

const FILTER_OPERATORS = {
  text: [
    { value: "contains", label: "Contains" },
    { value: "not_contains", label: "Does not contain" },
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
    { value: "starts_with", label: "Starts with" },
    { value: "ends_with", label: "Ends with" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  number: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
    { value: "greater_than", label: "Greater than" },
    { value: "greater_than_equal", label: "Greater than or equal" },
    { value: "less_than", label: "Less than" },
    { value: "less_than_equal", label: "Less than or equal" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  date: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
    { value: "greater_than", label: "After" },
    { value: "greater_than_equal", label: "After or on" },
    { value: "less_than", label: "Before" },
    { value: "less_than_equal", label: "Before or on" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  boolean: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
  ],
  array: [
    { value: "array_contains", label: "Contains" },
    { value: "array_not_contains", label: "Does not contain" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  select: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
  ],
} as const;

export function FilterPopover<T extends Record<string, unknown>>({
  column,
  data,
  currentFilter,
  onApplyFilter,
  children,
}: FilterPopoverProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [operator, setOperator] = useState<FilterOperator>(
    currentFilter?.operator || "contains",
  );
  const [value, setValue] = useState<FilterValue>(currentFilter?.value || "");
  const [arrayValues, setArrayValues] = useState<string[]>(
    Array.isArray(currentFilter?.value) ? currentFilter.value : [],
  );

  const filterType = column.filterType || "text";
  const operators = FILTER_OPERATORS[filterType] || FILTER_OPERATORS.text;

  // Extract unique values from column for select/array types
  const uniqueValues = Array.from(
    new Set(
      data
        .flatMap((row) => {
          const val = row[column.key];
          if (Array.isArray(val)) {
            return val;
          }
          return val;
        })
        .filter((v) => v !== null && v !== undefined && v !== "")
        .map(String),
    ),
  ).sort();

  const handleApplyFilter = () => {
    let finalValue: FilterValue = value;
    let label = "";

    // Handle empty/not empty operators
    if (operator === "is_empty" || operator === "is_not_empty") {
      finalValue = null;
      label = `${column.header} ${operators.find((op) => op.value === operator)?.label}`;
    }
    // Handle array operators
    else if (operator.startsWith("array_") && arrayValues.length > 0) {
      finalValue = arrayValues;
      label = `${column.header} ${operators.find((op) => op.value === operator)?.label} [${arrayValues.join(", ")}]`;
    }
    // Handle other operators
    else if (value !== "" && value !== null) {
      finalValue = value;
      const operatorLabel =
        operators.find((op) => op.value === operator)?.label || operator;
      label = `${column.header} ${operatorLabel} "${value}"`;
    } else {
      // No valid filter value
      onApplyFilter(null);
      setIsOpen(false);
      return;
    }

    const filter: ColumnFilter = {
      columnKey: column.key,
      operator,
      value: finalValue,
      label,
    };

    onApplyFilter(filter);
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    setOperator("contains");
    setValue("");
    setArrayValues([]);
    onApplyFilter(null);
    setIsOpen(false);
  };

  const needsValue = !["is_empty", "is_not_empty"].includes(operator);
  const isArrayOperator = operator.startsWith("array_");

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Filter {column.header}</h4>
            <p className="text-sm text-muted-foreground">
              Set conditions to filter this column
            </p>
          </div>

          <div className="space-y-3">
            {/* Operator Selection */}
            <div className="space-y-2">
              <Label htmlFor="operator">Condition</Label>
              <Select
                value={operator}
                onValueChange={(val) => setOperator(val as FilterOperator)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value Input */}
            {needsValue && (
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>

                {isArrayOperator ? (
                  /* Array Value Selection */
                  <div className="space-y-2">
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {uniqueValues.map((val) => (
                        <div key={val} className="flex items-center space-x-2">
                          <Checkbox
                            id={`array-${val}`}
                            checked={arrayValues.includes(val)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setArrayValues([...arrayValues, val]);
                              } else {
                                setArrayValues(
                                  arrayValues.filter((v) => v !== val),
                                );
                              }
                            }}
                          />
                          <Label htmlFor={`array-${val}`} className="text-sm">
                            {val}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {arrayValues.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {arrayValues.map((val) => (
                          <Badge
                            key={val}
                            variant="secondary"
                            className="text-xs"
                          >
                            {val}
                            <X
                              className="ml-1 h-3 w-3 cursor-pointer"
                              onClick={() =>
                                setArrayValues(
                                  arrayValues.filter((v) => v !== val),
                                )
                              }
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ) : filterType === "select" ? (
                  /* Select Type */
                  <Select value={String(value)} onValueChange={setValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a value..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(column.filterOptions || uniqueValues).map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : filterType === "boolean" ? (
                  /* Boolean Type */
                  <Select
                    value={String(value)}
                    onValueChange={(val) => setValue(val === "true")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select true or false..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : filterType === "number" ? (
                  /* Number Type */
                  <Input
                    type="number"
                    value={String(value)}
                    onChange={(e) => setValue(Number(e.target.value) || "")}
                    placeholder="Enter a number..."
                  />
                ) : filterType === "date" ? (
                  /* Date Type */
                  <Input
                    type="date"
                    value={
                      value instanceof Date
                        ? value.toISOString().split("T")[0]
                        : String(value)
                    }
                    onChange={(e) => setValue(e.target.value)}
                  />
                ) : (
                  /* Text Type */
                  <Input
                    value={String(value)}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter text..."
                  />
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={handleClearFilter}>
              Clear
            </Button>
            <div className="space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleApplyFilter}>
                <Check className="mr-1 h-4 w-4" />
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
