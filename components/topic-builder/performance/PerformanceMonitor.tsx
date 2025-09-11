"use client";

import { memo, useEffect, useRef } from "react";

interface PerformanceMonitorProps {
  componentName: string;
  children: React.ReactNode;
}

export const PerformanceMonitor = memo(function PerformanceMonitor({
  componentName,
  children,
}: PerformanceMonitorProps) {
  const renderStartTime = useRef<number>(0);
  const mountTime = useRef<number>(0);

  useEffect(() => {
    mountTime.current = performance.now();

    return () => {
      const unmountTime = performance.now();
      const totalLifetime = unmountTime - mountTime.current;

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Performance] ${componentName} lifetime: ${totalLifetime.toFixed(2)}ms`,
        );
      }
    };
  }, [componentName]);

  // Track render performance
  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;

    if (process.env.NODE_ENV === "development" && renderTime > 16) {
      console.warn(
        `[Performance] ${componentName} slow render: ${renderTime.toFixed(2)}ms`,
      );
    }
  });

  return <>{children}</>;
});
