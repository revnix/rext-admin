"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RecentSubscriptionsTableProps {
  subscriptions: Array<{
    subscription_id: string;
    user_email: string;
    user_name: string;
    plan_name: string;
    status: string;
    start_date: string | null;
  }>;
}

export function RecentSubscriptionsTable({
  subscriptions,
}: RecentSubscriptionsTableProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      active: "default",
      trial: "secondary",
      cancelled: "destructive",
      expired: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recent subscriptions found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Start Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subscriptions.map((sub) => (
          <TableRow key={sub.subscription_id}>
            <TableCell className="font-medium">{sub.user_name}</TableCell>
            <TableCell>{sub.user_email}</TableCell>
            <TableCell>{sub.plan_name}</TableCell>
            <TableCell>{getStatusBadge(sub.status)}</TableCell>
            <TableCell>{formatDate(sub.start_date)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
