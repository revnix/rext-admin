"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Check,
  FileText,
  Image as ImageIcon,
  Search,
  Video,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { MediaUploadDialog } from "@/components/media/media-upload-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import type { Media, MediaListParams } from "@/lib/api-client/media";
import { getMediaKind } from "@/lib/media-type";
import { toAbsoluteMediaUrl } from "@/lib/media-url";

interface MediaPickerDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: Media) => void;
  allowedTypes?: ("image" | "document" | "video")[];
  multiple?: boolean;
}

export function MediaPickerDialog({
  workspaceId,
  open,
  onOpenChange,
  onSelect,
  allowedTypes,
}: MediaPickerDialogProps) {
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileType, setFileType] = useState<
    "all" | "image" | "document" | "video"
  >("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Build query params
  const queryParams: MediaListParams = {
    page: 1,
    per_page: 50,
  };

  if (fileType !== "all") {
    queryParams.file_type = fileType;
  }

  // Fetch media
  const {
    data: response,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["media-picker", workspaceId, queryParams],
    queryFn: () => apiClient.media.list(workspaceId, queryParams),
    enabled: !!workspaceId && open,
    staleTime: 30 * 1000,
  });

  const mediaList = response?.items || [];

  // Filter by search query and allowed types
  const filteredMedia = mediaList.filter((m) => {
    // Search filter
    const matchesSearch = searchQuery
      ? m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : true;

    // Type filter
    const matchesType = allowedTypes
      ? allowedTypes.some((type) => getMediaKind(m.file_type) === type)
      : true;

    return matchesSearch && matchesType;
  });

  const handleSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia);
      setSelectedMedia(null);
      setSearchQuery("");
      onOpenChange(false);
      toast.success("Media selected");
    }
  };

  const handleUploadComplete = () => {
    refetch();
    setShowUploadDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Media</DialogTitle>
            <DialogDescription>
              Choose a media file from your library or upload a new one
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="library" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="library">Media Library</TabsTrigger>
              <TabsTrigger
                value="upload"
                onClick={() => setShowUploadDialog(true)}
              >
                Upload New
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="library"
              className="flex-1 flex flex-col min-h-0 space-y-4"
            >
              {/* Filters */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search media..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Select
                  value={fileType}
                  onValueChange={(
                    value: "all" | "image" | "document" | "video",
                  ) => setFileType(value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="File type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {(!allowedTypes || allowedTypes.includes("image")) && (
                      <SelectItem value="image">Images</SelectItem>
                    )}
                    {(!allowedTypes || allowedTypes.includes("document")) && (
                      <SelectItem value="document">Documents</SelectItem>
                    )}
                    {(!allowedTypes || allowedTypes.includes("video")) && (
                      <SelectItem value="video">Videos</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Media Grid */}
              <ScrollArea className="flex-1">
                {isLoading ? (
                  <div className="grid grid-cols-4 gap-4 p-1">
                    {Array.from({ length: 8 }, (_, i) => `skeleton-${i}`).map(
                      (id) => (
                        <div
                          key={id}
                          className="aspect-square bg-muted rounded-lg animate-pulse"
                        />
                      ),
                    )}
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No media files found
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4 p-1">
                    {filteredMedia.map((media) => (
                      <MediaPickerCard
                        key={media.id}
                        media={media}
                        selected={selectedMedia?.id === media.id}
                        onSelect={() => setSelectedMedia(media)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedMedia(null);
                setSearchQuery("");
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSelect} disabled={!selectedMedia}>
              Select Media
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <MediaUploadDialog
        workspaceId={workspaceId}
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUploaded={handleUploadComplete}
      />
    </>
  );
}

interface MediaPickerCardProps {
  media: Media;
  selected: boolean;
  onSelect: () => void;
}

function MediaPickerCard({ media, selected, onSelect }: MediaPickerCardProps) {
  const mediaKind = getMediaKind(media.file_type);
  const isImage = mediaKind === "image";
  const isVideo = mediaKind === "video";
  const isDocument = mediaKind === "document";

  const thumbnailUrl = toAbsoluteMediaUrl(media.thumbnail_url);
  const publicUrl = toAbsoluteMediaUrl(media.public_url);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
        selected
          ? "border-primary ring-2 ring-primary ring-offset-2"
          : "border-border hover:border-primary/50"
      }`}
    >
      {/* Preview */}
      {isImage && thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={media.alt_text || media.title || media.filename}
          fill
          className="object-cover"
          sizes="200px"
        />
      ) : isImage && publicUrl ? (
        <Image
          src={publicUrl}
          alt={media.alt_text || media.title || media.filename}
          fill
          className="object-cover"
          sizes="200px"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          {isVideo ? (
            <Video className="h-8 w-8 text-muted-foreground" />
          ) : isDocument ? (
            <FileText className="h-8 w-8 text-muted-foreground" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      )}

      {/* Selection Indicator */}
      {selected && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-4 w-4" />
        </div>
      )}

      {/* File Name Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <p
          className="text-xs text-white truncate"
          title={media.title || media.filename}
        >
          {media.title || media.filename}
        </p>
      </div>
    </button>
  );
}
