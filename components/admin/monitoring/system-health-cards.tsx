"use client";

import { Activity, Database, Server, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SystemHealthCardsProps {
  health: {
    database: {
      status: string;
      response_time_ms: number;
      connection_count: number;
      max_connections: number;
    };
    cache: {
      status: string;
      hit_rate?: number;
      memory_used_mb?: number;
    };
    api: {
      status: string;
      requests_per_minute: number;
      avg_response_time_ms: number;
      error_rate: number;
    };
    workers: {
      status: string;
      active_jobs?: number;
      failed_jobs_24h?: number;
    };
    timestamp: string;
  };
  isLoading: boolean;
}

export function SystemHealthCards({
  health,
  isLoading,
}: SystemHealthCardsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-50 border-green-200";
      case "degraded":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "unhealthy":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    const color = getStatusColor(status);
    return (
      <div
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}
      >
        <div className="w-2 h-2 rounded-full bg-current mr-1.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => `health-skeleton-${i}`).map(
          (key) => (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ),
        )}
      </div>
    );
  }

  const cards = [
    {
      title: "Database",
      icon: Database,
      status: health.database.status,
      metric: `${health.database.response_time_ms}ms`,
      description: `${health.database.connection_count}/${health.database.max_connections} connections`,
      color: "text-foreground",
    },
    {
      title: "API",
      icon: Activity,
      status: health.api.status,
      metric: `${health.api.requests_per_minute} req/min`,
      description: `${health.api.avg_response_time_ms}ms avg • ${health.api.error_rate}% errors`,
      color: "text-foreground",
    },
    {
      title: "Cache",
      icon: Zap,
      status: health.cache.status,
      metric:
        health.cache.status === "not_configured"
          ? "N/A"
          : `${health.cache.hit_rate || 0}%`,
      description:
        health.cache.status === "not_configured"
          ? "Not configured"
          : `${health.cache.memory_used_mb || 0} MB used`,
      color: "text-foreground",
    },
    {
      title: "Workers",
      icon: Server,
      status: health.workers.status,
      metric:
        health.workers.status === "not_configured"
          ? "N/A"
          : `${health.workers.active_jobs || 0} active`,
      description:
        health.workers.status === "not_configured"
          ? "Not configured"
          : `${health.workers.failed_jobs_24h || 0} failed (24h)`,
      color: "text-foreground",
    },
  ];

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="mb-2">{getStatusBadge(card.status)}</div>
                <div className="text-2xl font-bold">{card.metric}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground text-right mt-2">
        Last updated: {new Date(health.timestamp).toLocaleTimeString()}
      </p>
    </div>
  );
}
