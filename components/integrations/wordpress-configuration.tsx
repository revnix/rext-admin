"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function WordPressConfiguration() {
  const [enabled, setEnabled] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const siteUrl = "https://rextai-plugin.local";
  const apiKey = "rext_465f945160f3a0e36d5d31757c95737b6d8028dd";
  const apiEndpoint = "https://rextai-plugin.local/wp-json/rext-ai/v1/";

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-8 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start">
        {/* Enable Integration */}
        <div>
          <Label className="text-base font-medium text-slate-700">
            Enable Integration
          </Label>
        </div>
        <div className="space-y-2">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          <p className="text-sm text-muted-foreground">
            Enable or disable the Rext AI integration.
          </p>
        </div>

        {/* Site URL */}
        <div className="pt-2">
          <Label className="text-base font-medium text-slate-700">
            Site URL
          </Label>
        </div>
        <div className="space-y-2">
          <div className="flex gap-2 max-w-xl">
            <Input
              value={siteUrl}
              readOnly
              className="bg-slate-50 font-mono text-sm"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(siteUrl, "url")}
              className="shrink-0"
            >
              {copiedField === "url" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                "Copy"
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Your WordPress site URL for the Rext AI integration.
          </p>
        </div>

        {/* API Key */}
        <div className="pt-2">
          <Label className="text-base font-medium text-slate-700">
            API Key
          </Label>
        </div>
        <div className="space-y-2">
          <div className="max-w-xl">
            <Input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              readOnly
              className="bg-slate-50 font-mono text-sm mb-2"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-slate-600"
              >
                {showApiKey ? "Hide" : "Show"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(apiKey, "key")}
                className="text-slate-600"
              >
                {copiedField === "key" ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  "Copy"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                Regenerate
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Use this API key to authenticate requests from Rext AI.
          </p>
        </div>

        {/* API Endpoint */}
        <div className="pt-2">
          <Label className="text-base font-medium text-slate-700">
            API Endpoint
          </Label>
        </div>
        <div className="space-y-2">
          <div className="flex gap-2 max-w-xl">
            <Input
              value={apiEndpoint}
              readOnly
              className="bg-slate-50 font-mono text-sm"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(apiEndpoint, "endpoint")}
              className="shrink-0"
            >
              {copiedField === "endpoint" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                "Copy"
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            The REST API endpoint for Rext AI integration.
          </p>
        </div>
      </div>
    </div>
  );
}
