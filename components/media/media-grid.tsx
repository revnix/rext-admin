"use client";

import { FileText, Image as ImageIcon, Video } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { Media } from "@/lib/api-client/media";

interface MediaGridProps {
  media: Media[];
  onSelect: (media: Media) => void;
  isLoading?: boolean;
}

export function MediaGrid({ media, onSelect, isLoading }: MediaGridProps) {
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
        <MediaCard key={item.id} media={item} onSelect={onSelect} />
      ))}
    </div>
  );
}

interface MediaCardProps {
  media: Media;
  onSelect: (media: Media) => void;
}

function MediaCard({ media, onSelect }: MediaCardProps) {
  const isImage = media.file_type.startsWith("image/");
  const isVideo = media.file_type.startsWith("video/");
  const isDocument =
    media.file_type.startsWith("application/") ||
    media.file_type.startsWith("text/");

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect(media)}
    >
      {/* Thumbnail/Preview */}
      <div className="aspect-square bg-muted relative">
        {isImage && media.thumbnail_url ? (
          <Image
            src={media.thumbnail_url}
            alt={media.alt_text || media.title || media.filename}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          />
        ) : isImage && media.public_url ? (
          <Image
            src={media.public_url}
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
