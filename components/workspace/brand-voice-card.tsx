"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Brain,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BrandVoiceRefreshControl } from "@/components/workspace/brand-voice-refresh-control";
import { log } from "@/lib/logger";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { BrandVoice, Workspace } from "@/types/workspace";

interface BrandVoiceCardProps {
  workspace: Workspace;
}

interface ExpandableTextProps {
  content: string;
  maxLength?: number;
  label: string;
}

interface CopyButtonProps {
  content: string;
  label: string;
}

// Copy to clipboard utility
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand("copy");
      textArea.remove();
      return success;
    }
  } catch (error) {
    log.error("Failed to copy to clipboard:", error);
    return false;
  }
}

// Copy button component with feedback
function CopyButton({ content, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(content);

    if (success) {
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-6 w-6 p-0 hover:bg-muted/50"
      title={`Copy ${label.toLowerCase()}`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </Button>
  );
}

// Expandable text component for long content
function ExpandableText({
  content,
  maxLength = 150,
  label,
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = content.length > maxLength;
  const displayContent =
    shouldTruncate && !isExpanded
      ? `${content.slice(0, maxLength)}...`
      : content;

  if (!shouldTruncate) {
    return (
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground flex-1">{content}</p>
        <CopyButton content={content} label={label} />
      </div>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{displayContent}</p>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show more
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CopyButton content={content} label={label} />
      </div>
      <CollapsibleContent>
        {/* Content is handled by the displayContent logic above */}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Brand attribute section component
interface BrandAttributeSectionProps {
  title: string;
  content?: string;
  items?: string[];
  icon?: React.ReactNode;
  variant?: "text" | "list" | "badges";
}

function BrandAttributeSection({
  title,
  content,
  items,
  variant = "text",
}: BrandAttributeSectionProps) {
  if (!content && (!items || items.length === 0)) {
    return null;
  }

  const copyContent = content || (items ? items.join(", ") : "");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-foreground">{title}</h4>
        <CopyButton content={copyContent} label={title} />
      </div>

      {variant === "text" && content && (
        <ExpandableText content={content} label={title} maxLength={200} />
      )}

      {variant === "list" && items && items.length > 0 && (
        <div className="text-sm text-muted-foreground">{items.join(" • ")}</div>
      )}

      {variant === "badges" && items && items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge
              key={`${title}-${index}-${item}`}
              variant={
                title === "Voice Characteristics" ? "outline" : "secondary"
              }
              className="text-xs"
            >
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Temporal information component
function TemporalInfo({ brandVoice }: { brandVoice: BrandVoice }) {
  if (!brandVoice.created_at && !brandVoice.updated_at) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/40">
      {brandVoice.created_at && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            Extracted{" "}
            {formatDistanceToNow(new Date(brandVoice.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
      )}

      {brandVoice.updated_at &&
        brandVoice.updated_at !== brandVoice.created_at && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Updated{" "}
              {formatDistanceToNow(new Date(brandVoice.updated_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        )}
    </div>
  );
}

// Main brand voice card component
export function BrandVoiceCard({ workspace }: BrandVoiceCardProps) {
  const brandVoice = workspace.brand_voice;
  const brandVoiceRefresh = useWorkspaceStore(
    (state) => state.brandVoiceRefresh,
  );

  // Empty state
  if (!brandVoice) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">
            No Brand Voice Extracted
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Brand voice will be automatically extracted when you add content to
            this workspace. Start by adding web pages, files, or text content.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Brand Voice Profile
            </CardTitle>
            <CardDescription>
              AI-extracted brand characteristics and positioning from your
              workspace content
            </CardDescription>
          </div>
          <BrandVoiceRefreshControl workspaceId={workspace.id}>
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </span>
          </BrandVoiceRefreshControl>
        </div>
      </CardHeader>

      {/* Error display for refresh failures */}
      {brandVoiceRefresh.refreshError && (
        <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">
            {brandVoiceRefresh.refreshError}
          </p>
        </div>
      )}

      <CardContent className="space-y-6">
        {/* Brand Overview */}
        <BrandAttributeSection
          title="About"
          content={brandVoice.about}
          variant="text"
        />

        {/* Selling Position */}
        <BrandAttributeSection
          title="Unique Selling Position"
          content={brandVoice.selling_position}
          variant="text"
        />

        {/* Customer Profile */}
        <BrandAttributeSection
          title="Customer Profile"
          content={brandVoice.customer_profile}
          variant="text"
        />

        {/* Target Audience */}
        <BrandAttributeSection
          title="Target Audience"
          items={brandVoice.target_audience}
          variant="badges"
        />

        {/* Voice Characteristics */}
        <BrandAttributeSection
          title="Voice Characteristics"
          items={brandVoice.brand_voice}
          variant="badges"
        />

        {/* Content Strategy */}
        <BrandAttributeSection
          title="Content Strategy"
          items={brandVoice.content_strategy}
          variant="badges"
        />

        {/* Competitors */}
        <BrandAttributeSection
          title="Competitors"
          items={brandVoice.competitors}
          variant="list"
        />

        {/* Temporal Information */}
        <TemporalInfo brandVoice={brandVoice} />
      </CardContent>
    </Card>
  );
}

// Export simplified version for backward compatibility
export default BrandVoiceCard;
