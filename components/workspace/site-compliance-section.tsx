"use client";


import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";





interface SiteCompliance {
  security_headers?: {
    checked: boolean;
    headers_present: Record<string, string>;
  };
  cookie_consent?: {
    has_consent_banner: boolean;
    provider: string | null;
    detection_method?: string;
  };
}

interface SiteComplianceSectionProps {
  siteCompliance?: SiteCompliance;
}

export function SiteComplianceSection({ siteCompliance }: SiteComplianceSectionProps) {
  if (!siteCompliance) {
    return null;
  }

  const headersPresent = siteCompliance.security_headers?.headers_present || {};
  const headerNames = Object.keys(headersPresent);
  const hasConsentBanner = siteCompliance.cookie_consent?.has_consent_banner;
  const provider = siteCompliance.cookie_consent?.provider;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Website Compliance
      </Label>
      <div className="rounded-md border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Cookie Consent:</span>
          {hasConsentBanner ? (
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              {provider === "unknown" ? "Detected (custom implementation)" : provider}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <ShieldAlert className="h-3 w-3" />
              Not detected
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium">Security Headers:</span>
          {headerNames.length > 0 ? (
            headerNames.map((header) => (
              <Badge key={header} variant="outline" className="text-xs">
                {header}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground italic">None detected</span>
          )}
        </div>
      </div>
    </div>
  );
}