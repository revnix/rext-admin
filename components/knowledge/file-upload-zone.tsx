"use client";

import { AlertCircle, CheckCircle, FileText, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useFileKnowledgeStore } from "@/stores/knowledge";
import type { FileKnowledge } from "@/types/workspace";

interface FileUploadZoneProps {
  workspaceId: string;
  onUploadComplete?: (files: FileKnowledge[]) => void;
  className?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "completed" | "failed";
  error?: string;
  result?: FileKnowledge;
}

// File type validation
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;

export function FileUploadZone({
  workspaceId,
  onUploadComplete,
  className,
}: FileUploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const addItem = useFileKnowledgeStore((state) => state.addItem);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `File type ${file.type} is not supported. Please upload PDF, Word, text, or spreadsheet files.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
    }
    return null;
  }, []);

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: string[] } => {
      const errors: string[] = [];
      const valid: File[] = [];

      if (files.length > MAX_FILES) {
        errors.push(`Too many files. Maximum ${MAX_FILES} files allowed.`);
        return { valid: [], errors };
      }

      if (uploadingFiles.length + files.length > MAX_FILES) {
        errors.push(
          `Cannot upload ${files.length} files. Would exceed maximum of ${MAX_FILES} files.`,
        );
        return { valid: [], errors };
      }

      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          valid.push(file);
        }
      }

      return { valid, errors };
    },
    [uploadingFiles.length, validateFile],
  );

  const uploadFile = useCallback(
    async (uploadingFile: UploadingFile) => {
      try {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? { ...f, status: "uploading", progress: 0 }
              : f,
          ),
        );

        // Simulate progress updates (real implementation would use upload progress)
        const progressInterval = setInterval(() => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id && f.status === "uploading"
                ? { ...f, progress: Math.min(f.progress + 20, 90) }
                : f,
            ),
          );
        }, 200);

        const formData = new FormData();
        formData.append("file", uploadingFile.file);
        const result = await apiClient.knowledge.addFile(workspaceId, formData);

        clearInterval(progressInterval);

        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? {
                  ...f,
                  status: "completed",
                  progress: 100,
                  result: result as any,
                }
              : f,
          ),
        );

        // Add to store
        addItem(result as any);

        toast.success(
          `File "${uploadingFile.file.name}" uploaded successfully`,
        );
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? {
                  ...f,
                  status: "failed",
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : f,
          ),
        );

        toast.error(
          `Failed to upload "${uploadingFile.file.name}": ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    },
    [workspaceId, addItem],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      const { valid, errors } = validateFiles(files);

      // Show validation errors
      for (const error of errors) {
        toast.error(error);
      }

      if (valid.length === 0) return;

      // Create uploading file entries
      const newUploadingFiles: UploadingFile[] = valid.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: "uploading" as const,
      }));

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

      // Upload files
      for (const uploadingFile of newUploadingFiles) {
        uploadFile(uploadingFile);
      }
    },
    [uploadFile, validateFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        handleFiles(files);
        // Reset input
        e.target.value = "";
      }
    },
    [handleFiles],
  );

  const removeUploadingFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const completedFiles = uploadingFiles
    .filter((f) => f.status === "completed" && f.result)
    .map((f) => f.result as FileKnowledge);

  // Notify parent of completed uploads
  if (completedFiles.length > 0 && onUploadComplete) {
    onUploadComplete(completedFiles);
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Drop files here or click to upload
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Support for PDF, Word, text, and spreadsheet files up to{" "}
            {MAX_FILE_SIZE / 1024 / 1024}MB each
          </p>
          <input
            type="file"
            multiple
            accept={ALLOWED_FILE_TYPES.join(",")}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <Button asChild variant="outline">
            <label htmlFor="file-upload" className="cursor-pointer">
              Choose Files
            </label>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Maximum {MAX_FILES} files per upload
          </p>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Uploading Files</h4>
            <div className="space-y-3">
              {uploadingFiles.map((uploadingFile) => (
                <div
                  key={uploadingFile.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">
                        {uploadingFile.file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(uploadingFile.file.size)}
                      </span>
                    </div>
                    {uploadingFile.status === "uploading" && (
                      <Progress
                        value={uploadingFile.progress}
                        className="h-2"
                      />
                    )}
                    {uploadingFile.status === "failed" &&
                      uploadingFile.error && (
                        <div className="flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          {uploadingFile.error}
                        </div>
                      )}
                    {uploadingFile.status === "completed" && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Upload completed
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUploadingFile(uploadingFile.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
