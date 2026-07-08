"use client";

import { useEffect, useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useGoogleSearchConsoleSites,
  useGoogleSiteMapping,
  useSaveGoogleSiteMapping,
} from "@/hooks/use-google-integration";
import {
  integrationsApiService,
  type Integration,
} from "@/services/integrations-api";

interface GoogleSiteMappingFormProps {
  workspaceId: string;
  canManage: boolean;
}

/**
 * Lets the user map each connected WordPress site to a Search Console
 * property + GA4 property ID — the one-time setup step that unlocks
 * Modules 1-4 for that site's published content.
 */
export function GoogleSiteMappingForm({
  workspaceId,
  canManage,
}: GoogleSiteMappingFormProps) {
  const [sites, setSites] = useState<Integration[] | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    integrationsApiService
      .listIntegrations(workspaceId)
      .then((all) =>
        setSites(all.filter((i) => i.integration_type === "wordpress")),
      )
      .catch(() => setSites([]));
  }, [workspaceId]);

  if (sites === null) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <EmptyState
        title="No WordPress sites connected"
        description="Connect a WordPress site first — Google Search Console and GA4 data are tracked per connected site."
      />
    );
  }

  return (
    <div className="space-y-3">
      {sites.map((site) => (
        <SiteMappingRow
          key={site.id}
          workspaceId={workspaceId}
          siteId={site.id}
          siteUrl={site.site_url}
          canManage={canManage}
        />
      ))}
    </div>
  );
}

function SiteMappingRow({
  workspaceId,
  siteId,
  siteUrl,
  canManage,
}: {
  workspaceId: string;
  siteId: string;
  siteUrl: string;
  canManage: boolean;
}) {
  const { data: mapping, isLoading } = useGoogleSiteMapping(
    workspaceId,
    siteId,
  );
  const isMapped = !!(mapping?.gsc_site_url || mapping?.ga4_property_id);

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{siteUrl}</p>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading mapping…</p>
          ) : isMapped ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {mapping?.gsc_site_url && (
                <Badge variant="secondary" className="text-xs">
                  GSC: {mapping.gsc_site_url}
                </Badge>
              )}
              {mapping?.ga4_property_id && (
                <Badge variant="secondary" className="text-xs">
                  GA4: {mapping.ga4_property_id}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Not mapped yet</p>
          )}
        </div>
        {canManage && (
          <MappingDialog
            workspaceId={workspaceId}
            siteId={siteId}
            currentGscSiteUrl={mapping?.gsc_site_url ?? null}
            currentGa4PropertyId={mapping?.ga4_property_id ?? null}
          />
        )}
      </CardContent>
    </Card>
  );
}

function MappingDialog({
  workspaceId,
  siteId,
  currentGscSiteUrl,
  currentGa4PropertyId,
}: {
  workspaceId: string;
  siteId: string;
  currentGscSiteUrl: string | null;
  currentGa4PropertyId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [gscSiteUrl, setGscSiteUrl] = useState(currentGscSiteUrl ?? "");
  const [ga4PropertyId, setGa4PropertyId] = useState(
    currentGa4PropertyId ?? "",
  );

  const { data: gscSites, isLoading: sitesLoading } =
    useGoogleSearchConsoleSites(workspaceId, open);
  const saveMutation = useSaveGoogleSiteMapping();

  const handleSave = () => {
    saveMutation.mutate(
      {
        workspaceId,
        siteId,
        data: {
          gsc_site_url: gscSiteUrl || null,
          ga4_property_id: ga4PropertyId.trim() || null,
        },
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Map Search Console &amp; GA4</DialogTitle>
          <DialogDescription>
            Pick the verified Search Console property for this site, and paste
            its GA4 Property ID (found in GA4 → Admin → Property Settings).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="gsc-site">Search Console property</Label>
            <Select value={gscSiteUrl} onValueChange={setGscSiteUrl}>
              <SelectTrigger id="gsc-site">
                <SelectValue
                  placeholder={
                    sitesLoading ? "Loading properties…" : "Select a property"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {gscSites?.map((site) => (
                  <SelectItem key={site.siteUrl} value={site.siteUrl}>
                    {site.siteUrl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!sitesLoading && gscSites?.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No verified properties found for the connected Google account.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ga4-property">GA4 Property ID</Label>
            <Input
              id="ga4-property"
              placeholder="properties/123456789"
              value={ga4PropertyId}
              onChange={(e) => setGa4PropertyId(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
