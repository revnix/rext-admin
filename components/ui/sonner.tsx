"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group z-50"
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:shadow-md border rounded-md p-4",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "!bg-success-50 !border-success-200 !text-success-700",
          error: "!bg-danger-50 !border-danger-200 !text-danger-700",
          // Only error and success carry colour; other notices stay neutral.
          warning: "!bg-card !border-border !text-foreground",
          info: "!bg-card !border-border !text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
