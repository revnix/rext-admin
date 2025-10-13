"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { MediaPickerDialog } from "@/components/media/media-picker-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Media } from "@/lib/api-client/media";

interface MediaInputFieldProps {
  workspaceId: string;
  label: string;
  value: Media | null;
  onChange: (media: Media | null) => void;
  allowedTypes?: ("image" | "document" | "video")[];
  description?: string;
  required?: boolean;
}

/**
 * Media Input Field Component
 *
 * A reusable form field for selecting media from the library.
 * Can be used in any form that needs media selection.
 *
 * @example
 * ```tsx
 * const [featuredImage, setFeaturedImage] = useState<Media | null>(null);
 *
 * <MediaInputField
 *   workspaceId={workspace.id}
 *   label="Featured Image"
 *   value={featuredImage}
 *   onChange={setFeaturedImage}
 *   allowedTypes={["image"]}
 *   description="Select a featured image for this content"
 * />
 * ```
 */
export function MediaInputField({
  workspaceId,
  label,
  value,
  onChange,
  allowedTypes = ["image", "document", "video"],
  description,
  required = false,
}: MediaInputFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = (media: Media) => {
    onChange(media);
  };

  const handleRemove = () => {
    onChange(null);
  };

  const isImage = value?.file_type.startsWith("image/");

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {value ? (
        <div className="border rounded-lg p-4">
          <div className="flex items-start gap-4">
            {/* Preview */}
            {isImage && value.thumbnail_url ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={value.thumbnail_url}
                  alt={value.alt_text || value.title || value.filename}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ) : isImage && value.public_url ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={value.public_url}
                  alt={value.alt_text || value.title || value.filename}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-muted-foreground">
                  {value.file_extension?.toUpperCase() || "FILE"}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className="font-medium truncate"
                title={value.title || value.filename}
              >
                {value.title || value.filename}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {value.file_type}
              </p>
              {value.width && value.height && (
                <p className="text-sm text-muted-foreground">
                  {value.width} × {value.height} px
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPicker(true)}
              >
                Change
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setShowPicker(true)}
        >
          Select Media
        </Button>
      )}

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Media Picker Dialog */}
      <MediaPickerDialog
        workspaceId={workspaceId}
        open={showPicker}
        onOpenChange={setShowPicker}
        onSelect={handleSelect}
        allowedTypes={allowedTypes}
      />
    </div>
  );
}
