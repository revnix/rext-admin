"use client";

import { Globe, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  integrationsApiService,
  type Integration,
} from "@/services/integrations-api";

interface GoogleSiteSelectorProps {
  workspaceId: string;
  value: string | undefined;
  onChange: (siteId: string) => void;
}

/**
 * Lets the user pick which connected WordPress site the dashboard reports
 * on. Nothing is preselected when there are multiple sites — the user
 * chooses explicitly; a single-site workspace is selected automatically
 * since there is no choice to make.
 */
export function GoogleSiteSelector({
  workspaceId,
  value,
  onChange,
}: GoogleSiteSelectorProps) {
  const [sites, setSites] = useState<Integration[] | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    integrationsApiService
      .listIntegrations(workspaceId)
      .then((all) => {
        const wordpress = all.filter((i) => i.integration_type === "wordpress");
        setSites(wordpress);
        if (wordpress.length === 1) {
          onChange(wordpress[0].id);
        }
      })
      .catch(() => setSites([]));
  }, [workspaceId, onChange]);

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
        <Label
          htmlFor="dashboard-site"
          className="flex shrink-0 items-center gap-2 text-sm font-medium"
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          Site
        </Label>
        {sites === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading sites…
          </div>
        ) : sites.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No WordPress sites connected yet — connect one to see its data here.
          </p>
        ) : (
          <Select value={value ?? ""} onValueChange={onChange}>
            <SelectTrigger id="dashboard-site" className="sm:max-w-md">
              <SelectValue placeholder="Select a site to view its data" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.site_url}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  );
}
