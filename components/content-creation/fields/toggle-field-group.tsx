"use client";

import { Check, Settings } from "lucide-react";
import { useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ToggleFieldOption {
  id: string;
  label: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  defaultValue?: boolean;
  recommended?: boolean;
}

interface ToggleFieldGroupProps {
  fields: ToggleFieldOption[];
  values: Record<string, boolean>;
  label?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onChange: (fieldId: string, checked: boolean) => void;
  onTouch?: (fieldId: string) => void;
}

/**
 * Specialized Toggle Field Group Component
 *
 * Renders a group of related toggle/checkbox fields with icons,
 * descriptions, and visual feedback. Used for research settings,
 * content enhancements, etc.
 */
export function ToggleFieldGroup({
  fields,
  values,
  label = "Options",
  description,
  icon: Icon = Settings,
  onChange,
  onTouch,
}: ToggleFieldGroupProps) {
  // Handle toggle change
  const handleToggleChange = useCallback(
    (fieldId: string, checked: boolean) => {
      onChange(fieldId, checked);
      onTouch?.(fieldId);
    },
    [onChange, onTouch],
  );

  // Count enabled options
  const enabledCount = Object.values(values).filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {label}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        {fields.map((field) => {
          const FieldIcon = field.icon;
          const isChecked = values[field.id] ?? field.defaultValue ?? false;

          return (
            <div key={field.id} className="flex items-start space-x-3">
              <Checkbox
                id={field.id}
                checked={isChecked}
                onCheckedChange={(checked) =>
                  handleToggleChange(field.id, !!checked)
                }
              />
              <div className="space-y-0.5 flex-1">
                <Label
                  htmlFor={field.id}
                  className="font-medium cursor-pointer flex items-center gap-2"
                >
                  {FieldIcon && <FieldIcon className="h-4 w-4" />}
                  {field.label}
                  {field.recommended && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {field.description}
                </p>
              </div>
            </div>
          );
        })}

        {/* Summary */}
        {enabledCount > 0 && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              <strong>
                {enabledCount} enhancement{enabledCount !== 1 ? "s" : ""}{" "}
                enabled:
              </strong>
              <div className="mt-1 text-sm">
                {fields
                  .filter(
                    (field) => values[field.id] ?? field.defaultValue ?? false,
                  )
                  .map((field) => field.label)
                  .join(", ")}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
