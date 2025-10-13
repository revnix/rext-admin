"use client";

import { Copy, Download, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth-utils";

interface ContentEditorProps {
  contentId: string;
  workspaceId: string;
  initialMarkdown: string;
  title: string;
  onSaveSuccess?: () => void;
}

export function ContentEditor({
  contentId,
  workspaceId,
  initialMarkdown,
  title,
  onSaveSuccess,
}: ContentEditorProps) {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Calculate content statistics
  const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length;
  const charCount = markdown.length;
  const lineCount = markdown.split("\n").length;
  const readingTimeMinutes = Math.ceil(wordCount / 200); // Average reading speed: 200 words/min

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/v1/content/${contentId}?workspace_id=${workspaceId}`,
        {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body_markdown: markdown,
            status: "ready",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save content");
      }

      toast.success("Content saved successfully!");
      setHasUnsavedChanges(false);
      onSaveSuccess?.();
    } catch (_error) {
      toast.error("Failed to save content. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("Content copied to clipboard!");
    } catch (_error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Content downloaded!");
    } catch (_error) {
      toast.error("Failed to download content");
    }
  };

  const handleMarkdownChange = (value: string) => {
    setMarkdown(value);
    setHasUnsavedChanges(value !== initialMarkdown);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Content Editor</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Edit your generated content in Markdown format
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyToClipboard}
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              title="Download as Markdown"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              title={hasUnsavedChanges ? "Save changes" : "No changes to save"}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Markdown Editor */}
        <div className="space-y-2">
          <label
            htmlFor="content-markdown"
            className="text-sm font-medium flex items-center justify-between"
          >
            <span>Content (Markdown)</span>
            {hasUnsavedChanges && (
              <span className="text-xs text-orange-600 font-normal">
                Unsaved changes
              </span>
            )}
          </label>
          <textarea
            id="content-markdown"
            className="w-full min-h-[600px] p-4 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none resize-y"
            value={markdown}
            onChange={(e) => handleMarkdownChange(e.target.value)}
            placeholder="Generated content will appear here..."
          />
        </div>

        {/* Content Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Words</p>
            <p className="text-lg font-semibold">
              {wordCount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Characters</p>
            <p className="text-lg font-semibold">
              {charCount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lines</p>
            <p className="text-lg font-semibold">
              {lineCount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Reading Time</p>
            <p className="text-lg font-semibold">{readingTimeMinutes} min</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
