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
          toast:
            "group toast group-[.toaster]:shadow-lg border-2 rounded-xl p-4",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "!bg-[#e8f5e9] !border-[#4caf50] !text-[#1b5e20]",
          error: "!bg-[#ffebee] !border-[#f44336] !text-[#b71c1c]",
          warning: "!bg-[#fff9c4] !border-[#ff9800] !text-[#e65100]",
          info: "!bg-[#e3f2fd] !border-[#2196f3] !text-[#0d47a1]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
