"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileText, Globe, Loader2, Type, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useCheckLimit } from "@/components/subscription/limit-check-wrapper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";

// Form schemas for each knowledge type
const webKnowledgeSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  title: z.string().optional(),
});

const fileKnowledgeSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File must be less than 10MB",
    )
    .refine(
      (file) =>
        [
          "application/pdf",
          "text/plain",
          "text/markdown",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(file.type),
      "File type not supported. Please upload PDF, TXT, MD, DOC, or DOCX files.",
    ),
});

const textKnowledgeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(50000, "Content too long"),
});

type WebKnowledgeFormData = z.infer<typeof webKnowledgeSchema>;
type FileKnowledgeFormData = z.infer<typeof fileKnowledgeSchema>;
type TextKnowledgeFormData = z.infer<typeof textKnowledgeSchema>;

interface WorkspaceAddKnowledgeDialogProps {
  workspaceId: string;
  knowledgeBaseId?: string; // Optional: pre-select a specific KB
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: () => void;
}

/**
 * Workspace Add Knowledge Dialog
 *
 * Multi-tabbed dialog for adding different types of knowledge:
 * - Web: Scrape content from a URL
 * - File: Upload a document
 * - Text: Add direct text content
 */
export function WorkspaceAddKnowledgeDialog({
  workspaceId,
  knowledgeBaseId,
  open,
  onOpenChange,
  onAdded,
}: WorkspaceAddKnowledgeDialogProps) {
  const [activeTab, setActiveTab] = useState<"web" | "file" | "text">("web");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedKbId, setSelectedKbId] = useState<string>(
    knowledgeBaseId || "",
  );

  // Check knowledge items limit
  const { checkLimit } = useCheckLimit("knowledge_items");

  // Fetch knowledge bases for the dropdown
  const { data: kbResponse } = useQuery({
    queryKey: ["knowledge-bases", workspaceId],
    queryFn: () => apiClient.knowledge.listBases(workspaceId),
    enabled: !!workspaceId && open,
    staleTime: 2 * 60 * 1000,
  });

  const knowledgeBases = kbResponse?.knowledge_bases || [];
  const defaultKb = knowledgeBases.find((kb) => kb.type === "default");

  // Set default KB if no KB is pre-selected
  if (!selectedKbId && defaultKb && open) {
    setSelectedKbId(defaultKb.id);
  }

  // Update selectedKbId when knowledgeBaseId prop changes
  if (knowledgeBaseId && selectedKbId !== knowledgeBaseId) {
    setSelectedKbId(knowledgeBaseId);
  }

  // Web knowledge form
  const webForm = useForm<WebKnowledgeFormData>({
    resolver: zodResolver(webKnowledgeSchema),
    defaultValues: {
      url: "",
      title: "",
    },
  });

  // File knowledge form
  const fileForm = useForm<FileKnowledgeFormData>({
    resolver: zodResolver(fileKnowledgeSchema),
  });

  // Text knowledge form
  const textForm = useForm<TextKnowledgeFormData>({
    resolver: zodResolver(textKnowledgeSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Add web knowledge mutation
  const addWebMutation = useMutation({
    mutationFn: (data: WebKnowledgeFormData) =>
      apiClient.knowledge.addWeb(
        workspaceId,
        data.url,
        data.title,
        selectedKbId,
      ),
    onSuccess: () => {
      toast.success("Website added successfully");
      webForm.reset();
      onOpenChange(false);
      onAdded?.();
    },
    onError: (error: Error) => {
      toast.error(`Failed to add website: ${error.message}`);
    },
  });

  // Add file knowledge mutation
  const addFileMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.knowledge.addFile(workspaceId, formData, selectedKbId);
    },
    onSuccess: () => {
      toast.success("File uploaded successfully");
      fileForm.reset();
      setSelectedFile(null);
      onOpenChange(false);
      onAdded?.();
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload file: ${error.message}`);
    },
  });

  // Add text knowledge mutation
  const addTextMutation = useMutation({
    mutationFn: (data: TextKnowledgeFormData) =>
      apiClient.knowledge.addText(
        workspaceId,
        data.title,
        data.content,
        selectedKbId,
      ),
    onSuccess: () => {
      toast.success("Text knowledge added successfully");
      textForm.reset();
      onOpenChange(false);
      onAdded?.();
    },
    onError: (error: Error) => {
      toast.error(`Failed to add text: ${error.message}`);
    },
  });

  const onWebSubmit = (data: WebKnowledgeFormData) => {
    if (!checkLimit("add knowledge")) {
      return;
    }
    addWebMutation.mutate(data);
  };

  const onFileSubmit = (data: FileKnowledgeFormData) => {
    if (!checkLimit("add knowledge")) {
      return;
    }
    if (data.file) {
      addFileMutation.mutate(data.file);
    }
  };

  const onTextSubmit = (data: TextKnowledgeFormData) => {
    if (!checkLimit("add knowledge")) {
      return;
    }
    addTextMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      fileForm.setValue("file", file);
    }
  };

  const isLoading =
    addWebMutation.isPending ||
    addFileMutation.isPending ||
    addTextMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Knowledge</DialogTitle>
          <DialogDescription>
            Add new knowledge to your workspace from various sources
          </DialogDescription>
        </DialogHeader>

        {/* Knowledge Base Selector */}
        <div className="space-y-2">
          <label
            htmlFor="knowledge-base-select"
            className="text-sm font-medium"
          >
            Knowledge Base
          </label>
          <Select
            value={selectedKbId}
            onValueChange={setSelectedKbId}
            disabled={isLoading || !!knowledgeBaseId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a knowledge base" />
            </SelectTrigger>
            <SelectContent>
              {knowledgeBases.map((kb) => (
                <SelectItem key={kb.id} value={kb.id}>
                  {kb.name}
                  {kb.type === "default" && " (Default)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {knowledgeBaseId
              ? "Adding to the selected knowledge base"
              : "Choose which knowledge base to add this item to"}
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="web">
              <Globe className="h-4 w-4 mr-2" />
              Website
            </TabsTrigger>
            <TabsTrigger value="file">
              <FileText className="h-4 w-4 mr-2" />
              File
            </TabsTrigger>
            <TabsTrigger value="text">
              <Type className="h-4 w-4 mr-2" />
              Text
            </TabsTrigger>
          </TabsList>

          {/* Web Knowledge Tab */}
          <TabsContent value="web">
            <Form {...webForm}>
              <form
                onSubmit={webForm.handleSubmit(onWebSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={webForm.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the URL of the website to scrape and add to
                        knowledge base
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={webForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Custom title for this source"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave blank to use the page title automatically
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Add Website
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* File Knowledge Tab */}
          <TabsContent value="file">
            <Form {...fileForm}>
              <form
                onSubmit={fileForm.handleSubmit(onFileSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={fileForm.control}
                  name="file"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Upload File</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Input
                              type="file"
                              accept=".pdf,.txt,.md,.doc,.docx"
                              onChange={handleFileChange}
                              disabled={isLoading}
                              {...field}
                            />
                          </div>
                          {selectedFile && (
                            <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                              <Upload className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {selectedFile.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Supported formats: PDF, TXT, MD, DOC, DOCX (max 10MB)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || !selectedFile}>
                    {isLoading && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Upload File
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Text Knowledge Tab */}
          <TabsContent value="text">
            <Form {...textForm}>
              <form
                onSubmit={textForm.handleSubmit(onTextSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={textForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Knowledge title"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={textForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your knowledge content here..."
                          className="min-h-[200px]"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Add direct text content to your knowledge base
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Add Text
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
