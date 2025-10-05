/**
 * Validation Display Component
 *
 * Displays validation errors and warnings for export customization.
 */

"use client";

import { AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TemplateValidation } from "@/types/export-customization";

interface ValidationDisplayProps {
  validation: TemplateValidation;
}

export function ValidationDisplay({ validation }: ValidationDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {validation.isValid ? (
            <Info className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          )}
          Validation Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {validation.errors.map((error, index) => (
          <div
            key={`error-${error.field}-${index}`}
            className="flex items-center gap-2 text-destructive"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              <strong>{error.field}:</strong> {error.message}
            </span>
          </div>
        ))}
        {validation.warnings.map((warning, index) => (
          <div
            key={`warning-${warning.field}-${index}`}
            className="flex items-center gap-2 text-amber-600"
          >
            <Info className="h-4 w-4" />
            <span className="text-sm">
              <strong>{warning.field}:</strong> {warning.message}
              {warning.suggestion && (
                <span className="italic"> ({warning.suggestion})</span>
              )}
            </span>
          </div>
        ))}
        {validation.isValid &&
          validation.errors.length === 0 &&
          validation.warnings.length === 0 && (
            <div className="flex items-center gap-2 text-green-600">
              <Info className="h-4 w-4" />
              <span className="text-sm">Configuration is valid</span>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
