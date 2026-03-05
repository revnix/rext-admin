import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCard {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

interface StatsCardsProps {
  stats: StatCard[];
  className?: string;
}

export function StatsCards({ stats, className = "" }: StatsCardsProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            {stat.icon && (
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            )}
            {stat.trend && (
              <p
                className={`text-xs mt-1 ${
                  stat.trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {stat.trend.value}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
