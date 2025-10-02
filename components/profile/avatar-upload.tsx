"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { deleteAvatar, uploadAvatar } from "@/services/profile-api";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userInitials: string;
}

export function AvatarUpload({
  currentAvatarUrl,
  userInitials,
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      toast.success("Avatar uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setPreviewUrl(null);
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAvatar,
    onSuccess: () => {
      toast.success("Avatar deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setPreviewUrl(null);
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image",
      );
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(
        `File too large. Max 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      );
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    uploadMutation.mutate(file);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete your avatar?")) {
      deleteMutation.mutate();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || currentAvatarUrl;
  const isLoading = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={displayUrl || undefined} alt="User avatar" />
          <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
        </Avatar>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUploadClick}
          disabled={isLoading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload new avatar
        </Button>
        {currentAvatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Remove avatar
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          JPG, PNG, GIF or WebP. Max 5MB.
        </p>
      </div>
    </div>
  );
}
