"use client";

import { FileText, Image as ImageIcon, Video } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { getMediaKind } from "@/lib/media-type";
import { toAbsoluteMediaUrl } from "@/lib/media-url";
import type { Media } from "@/lib/api-client/media";
import { formatFileSize } from "@/lib/formatters/number-formatters";

interface MediaGridProps {
  media: Media[];
  onSelect: (media: Media) => void;
  isLoading?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (mediaId: string, selected: boolean) => void;
  selectionMode?: boolean;
}

export function MediaGrid({
  media,
  onSelect,
  isLoading,
  selectedIds,
  onSelectionChange,
  selectionMode = false,
}: MediaGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }, (_, i) => `skeleton-${i}`).map((id) => (
          <Card key={id} className="overflow-hidden">
            <div className="aspect-square bg-muted animate-pulse" />
            <CardContent className="p-3">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded mt-2 w-2/3 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
        <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">No media files</p>
        <p className="text-sm text-muted-foreground">
          Upload your first file to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {media.map((item) => (
        <MediaCard
          key={item.id}
          media={item}
          onSelect={onSelect}
          isSelected={selectedIds?.has(item.id) || false}
          onSelectionChange={onSelectionChange}
          selectionMode={selectionMode}
        />
      ))}
    </div>
  );
}

interface MediaCardProps {
  media: Media;
  onSelect: (media: Media) => void;
  isSelected?: boolean;
  onSelectionChange?: (mediaId: string, selected: boolean) => void;
  selectionMode?: boolean;
}

function MediaCard({
  media,
  onSelect,
  isSelected = false,
  onSelectionChange,
  selectionMode = false,
}: MediaCardProps) {
  const mediaKind = getMediaKind(media.file_type);
  const isImage = mediaKind === "image";
  const isVideo = mediaKind === "video";
  const isDocument = mediaKind === "document";

  // local `formatFileSize` declaration is removed.
  // Existing render calls are kept and now use the shared import

  // Convert relative URLs to absolute URLs pointing to backend
  // const getAbsoluteUrl = (url: string | null): string | null => {
  //   if (!url) return null;
  //   if (url.startsWith("http://") || url.startsWith("https://")) {
  //     return url; // Already absolute
  //   }
  //   // Relative URL - prepend backend URL
  //   const backendUrl = resolveApiBaseUrl();
  //   return `${backendUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  // };

  const thumbnailUrl = toAbsoluteMediaUrl(media.thumbnail_url);
  const publicUrl = toAbsoluteMediaUrl(media.public_url);

  const handleClick = () => {
    if (selectionMode && onSelectionChange) {
      onSelectionChange(media.id, !isSelected);
    } else {
      onSelect(media);
    }
  };

  return (
    <Card
      className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={handleClick}
    >
      {/* Selection Checkbox */}
      {selectionMode && onSelectionChange && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) =>
              onSelectionChange(media.id, checked === true)
            }
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-2"
          />
        </div>
      )}

      {/* Thumbnail/Preview */}
      <div className="aspect-square bg-muted relative">
        {isImage && thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={media.alt_text || media.title || media.filename}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          />
        ) : isImage && publicUrl ? (
          <Image
            src={publicUrl}
            alt={media.alt_text || media.title || media.filename}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {isVideo ? (
              <Video className="h-12 w-12 text-muted-foreground" />
            ) : isDocument ? (
              <FileText className="h-12 w-12 text-muted-foreground" />
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
        )}

        {/* File Type Badge */}
        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded">
          {media.file_extension?.replace(".", "").toUpperCase() || "FILE"}
        </div>
      </div>

      {/* Info */}
      <CardContent className="p-3">
        <p
          className="text-sm font-medium truncate"
          title={media.title || media.filename}
        >
          {media.title || media.filename}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {formatFileSize(media.file_size)}
          </p>
          {media.width && media.height && (
            <p className="text-xs text-muted-foreground">
              {media.width}×{media.height}
            </p>
          )}
        </div>
        {media.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {media.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-block text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
            {media.tags.length > 2 && (
              <span className="inline-block text-[10px] text-muted-foreground">
                +{media.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
