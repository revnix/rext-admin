import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  warning?: string;
  isValid?: boolean;
  required?: boolean;
  className?: string;
  htmlFor?: string;
}

export function FormField({
  children,
  label,
  error,
  warning,
  isValid,
  required,
  className,
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {isValid && !error && (
            <Check className="inline h-4 w-4 ml-2 text-green-500" />
          )}
        </label>
      )}

      <div className="relative">
        {children}
        {error && (
          <div className="flex items-center gap-2 mt-1">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
        {warning && !error && (
          <div className="flex items-center gap-2 mt-1">
            <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
            <p className="text-sm text-yellow-600">{warning}</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ValidationInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  isValid?: boolean;
}

export function ValidationInput({
  error,
  isValid,
  className,
  ...props
}: ValidationInputProps) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-red-500 focus-visible:ring-red-500",
        isValid && !error && "border-green-500",
        className,
      )}
      {...props}
    />
  );
}
