"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CohortRetentionMatrixProps {
  cohorts: Array<{
    cohort: string;
    size: number;
    month_0: number;
    [key: string]: number | string;
  }>;
}

export function CohortRetentionMatrix({ cohorts }: CohortRetentionMatrixProps) {
  if (!cohorts || cohorts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No cohort data available
      </div>
    );
  }

  // Find maximum months across all cohorts
  const maxMonths = Math.max(
    ...cohorts.map(
      (cohort) =>
        Object.keys(cohort).filter((key) => key.startsWith("month_")).length,
    ),
  );

  const getRetentionColor = (retention: number) => {
    if (retention >= 90) return "bg-green-100 text-green-900";
    if (retention >= 80) return "bg-green-50 text-green-800";
    if (retention >= 70) return "bg-yellow-50 text-yellow-800";
    if (retention >= 60) return "bg-orange-50 text-orange-800";
    return "bg-red-50 text-red-800";
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10">
              Cohort
            </TableHead>
            <TableHead>Size</TableHead>
            {Array.from({ length: maxMonths }).map((_, i) => (
              <TableHead key={i}>Month {i}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {cohorts.map((cohort) => (
            <TableRow key={cohort.cohort}>
              <TableCell className="sticky left-0 bg-background font-medium">
                {cohort.cohort}
              </TableCell>
              <TableCell>{cohort.size}</TableCell>
              {Array.from({ length: maxMonths }).map((_, i) => {
                const monthKey = `month_${i}`;
                const value = cohort[monthKey];

                if (typeof value !== "number") {
                  return <TableCell key={i}>-</TableCell>;
                }

                return (
                  <TableCell key={i} className={getRetentionColor(value)}>
                    {value.toFixed(1)}%
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <span className="font-medium">Legend:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded" />
          <span>90%+</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-50 rounded" />
          <span>70-90%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-50 rounded" />
          <span>&lt;60%</span>
        </div>
      </div>
    </div>
  );
}
