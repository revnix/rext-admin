"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { getTooltipsForPage } from "@/config/feature-tooltips";

interface TooltipContextType {
  enabled: boolean;
  toggleTooltips: () => void;
  setTooltipsEnabled: (enabled: boolean) => void;
}

const TooltipContext = createContext<TooltipContextType>({
  enabled: false,
  toggleTooltips: () => {},
  setTooltipsEnabled: () => {},
});

export function useTooltips() {
  return useContext(TooltipContext);
}

interface TooltipProviderProps {
  children: React.ReactNode;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  const [enabled, setEnabled] = useState(false);
  const pathname = usePathname();

  // Load tooltip preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("show-feature-tooltips");
    if (stored !== null) {
      setEnabled(stored === "true");
    } else {
      // Default to true for new users
      setEnabled(true);
      localStorage.setItem("show-feature-tooltips", "true");
    }
  }, []);

  const toggleTooltips = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    localStorage.setItem("show-feature-tooltips", String(newValue));
  };

  const setTooltipsEnabled = (value: boolean) => {
    setEnabled(value);
    localStorage.setItem("show-feature-tooltips", String(value));
  };

  // Get tooltips for current page
  const tooltips = getTooltipsForPage(pathname || "");

  return (
    <TooltipContext.Provider
      value={{ enabled, toggleTooltips, setTooltipsEnabled }}
    >
      {children}
      {enabled &&
        tooltips.map((tooltip) => (
          <Tooltip
            key={tooltip.id}
            id={tooltip.id}
            place={tooltip.placement || "top"}
            content={
              <div className="max-w-xs">
                <div className="font-semibold mb-1">{tooltip.title}</div>
                <div className="text-sm">{tooltip.content}</div>
              </div>
            }
            className="!bg-primary !text-primary-foreground !opacity-100 !rounded-lg !shadow-lg !z-50"
            style={{
              backgroundColor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              padding: "12px",
              borderRadius: "8px",
              maxWidth: "320px",
            }}
          />
        ))}
    </TooltipContext.Provider>
  );
}
