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
          success: "!bg-[#e8f5e9] !border-[#4caf50] !text-[#1b5e20]",
          error: "!bg-[#ffebee] !border-[#f44336] !text-[#b71c1c]",
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
