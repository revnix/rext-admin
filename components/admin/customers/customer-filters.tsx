"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";

interface CustomerFiltersProps {
  status: string | null;
  planId: string | null;
  onStatusChange: (status: string | null) => void;
  onPlanIdChange: (planId: string | null) => void;
}

export function CustomerFilters({
  status,
  planId,
  onStatusChange,
  onPlanIdChange,
}: CustomerFiltersProps) {
  // Fetch available plans
  const { data: plansData } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      return await apiClient
        .request<{ data: any }>("/api/v1/subscriptions/plans")
        .then((res) => res.data);
    },
  });

  const plans = plansData?.data || [];

  const hasActiveFilters = status || planId;

  const clearFilters = () => {
    onStatusChange(null);
    onPlanIdChange(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Status Filter */}
      <div className="w-[200px]">
        <Select
          value={status || "all"}
          onValueChange={(value) =>
            onStatusChange(value === "all" ? null : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="free">Free (No Subscription)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Plan Filter */}
      <div className="w-[200px]">
        <Select
          value={planId || "all"}
          onValueChange={(value) =>
            onPlanIdChange(value === "all" ? null : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {plans.map((plan: any) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
