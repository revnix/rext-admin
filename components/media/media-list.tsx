"use client";

import {
  FileText,
  Image as ImageIcon,
  MoreVertical,
  Video,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMediaKind } from "@/lib/media-type";
import type { Media } from "@/lib/api-client/media";
import { toAbsoluteMediaUrl } from "@/lib/media-url";

interface MediaListProps {
  media: Media[];
  onSelect: (media: Media) => void;
  isLoading?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (mediaId: string, selected: boolean) => void;
  selectionMode?: boolean;
}

export function MediaList({
  media,
  onSelect,
  isLoading,
  selectedIds,
  onSelectionChange,
  selectionMode = false,
}: MediaListProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {selectionMode && <TableHead className="w-[50px]"></TableHead>}
              <TableHead className="w-[60px]">Preview</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((id) => (
              <TableRow key={id}>
                <TableCell>
                  <div className="w-10 h-10 bg-muted rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded w-12 animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                </TableCell>
                <TableCell />
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            {selectionMode && <TableHead className="w-[50px]"></TableHead>}
            <TableHead className="w-[60px]">Preview</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Dimensions</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {media.map((item) => (
            <MediaRow
              key={item.id}
              media={item}
              onSelect={onSelect}
              isSelected={selectedIds?.has(item.id) || false}
              onSelectionChange={onSelectionChange}
              selectionMode={selectionMode}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface MediaRowProps {
  media: Media;
  onSelect: (media: Media) => void;
  isSelected?: boolean;
  onSelectionChange?: (mediaId: string, selected: boolean) => void;
  selectionMode?: boolean;
}

function MediaRow({
  media,
  onSelect,
  isSelected = false,
  onSelectionChange,
  selectionMode = false,
}: MediaRowProps) {
  const mediaKind = getMediaKind(media.file_type);
  const isImage = mediaKind === "image";
  const isVideo = mediaKind === "video";
  const isDocument = mediaKind === "document";

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
  };

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
    <TableRow
      className={`cursor-pointer hover:bg-muted/50 ${
        isSelected ? "bg-muted/50" : ""
      }`}
      onClick={handleClick}
    >
      {/* Selection Checkbox */}
      {selectionMode && onSelectionChange && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) =>
              onSelectionChange(media.id, checked === true)
            }
          />
        </TableCell>
      )}

      {/* Preview */}
      <TableCell>
        <div className="w-10 h-10 bg-muted relative rounded overflow-hidden">
          {isImage && thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={media.alt_text || media.title || media.filename}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : isImage && publicUrl ? (
            <Image
              src={publicUrl}
              alt={media.alt_text || media.title || media.filename}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {isVideo ? (
                <Video className="h-5 w-5 text-muted-foreground" />
              ) : isDocument ? (
                <FileText className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          )}
        </div>
      </TableCell>

      {/* Name */}
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span
            className="truncate max-w-xs"
            title={media.title || media.filename}
          >
            {media.title || media.filename}
          </span>
          {media.title && media.title !== media.original_filename && (
            <span className="text-xs text-muted-foreground truncate max-w-xs">
              {media.original_filename}
            </span>
          )}
        </div>
      </TableCell>

      {/* Type */}
      <TableCell>
        <span className="inline-block text-xs bg-muted px-2 py-1 rounded font-medium">
          {media.file_extension?.replace(".", "").toUpperCase() || "FILE"}
        </span>
      </TableCell>

      {/* Size */}
      <TableCell className="text-sm text-muted-foreground">
        {formatFileSize(media.file_size)}
      </TableCell>

      {/* Dimensions */}
      <TableCell className="text-sm text-muted-foreground">
        {media.width && media.height ? (
          `${media.width}×${media.height}`
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </TableCell>

      {/* Tags */}
      <TableCell>
        {media.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {media.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
            {media.tags.length > 3 && (
              <span className="inline-block text-xs text-muted-foreground">
                +{media.tags.length - 3}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground/50">—</span>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onSelect(media);
              }}
            >
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
