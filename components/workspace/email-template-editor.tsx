"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, Loader2, RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiClient, type EmailTemplate } from "@/lib/api-client";

const templateTypes = [
  {
    value: "workspace_invitation",
    label: "Workspace Invitation",
    description: "Sent when inviting someone to join a workspace",
  },
  {
    value: "invitation_accepted",
    label: "Invitation Accepted",
    description: "Sent to workspace owner when invitation is accepted",
  },
  {
    value: "role_changed",
    label: "Role Changed",
    description: "Sent when a member's role is updated",
  },
  {
    value: "member_removed",
    label: "Member Removed",
    description: "Sent when a member is removed from workspace",
  },
  {
    value: "welcome",
    label: "Welcome",
    description: "Welcome message for new members",
  },
];

const templateSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(255),
  body: z.string().min(1, "Body is required"),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface EmailTemplateEditorProps {
  workspaceId: string;
  template?: EmailTemplate;
  onSave?: () => void;
}

export function EmailTemplateEditor({
  workspaceId,
  template,
  onSave,
}: EmailTemplateEditorProps) {
  const [selectedType, setSelectedType] = useState(
    template?.template_type || "workspace_invitation",
  );
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    rendered_subject: string;
    rendered_body: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      subject: template?.subject || "",
      body: template?.body || "",
    },
  });

  const currentSubject = watch("subject");
  const currentBody = watch("body");

  // Get available variables for selected type
  const { data: variables, isLoading: variablesLoading } = useQuery({
    queryKey: ["template-variables", selectedType],
    queryFn: () => apiClient.emailTemplates.getVariables(selectedType),
  });

  // Get default template
  const { data: defaultTemplate, isLoading: defaultLoading } = useQuery({
    queryKey: ["default-template", selectedType],
    queryFn: () => apiClient.emailTemplates.getDefault(selectedType),
    enabled: !template,
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async () => {
      const result = await apiClient.emailTemplates.preview({
        template_type: selectedType,
        subject: currentSubject,
        body: currentBody,
      });
      return result;
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setShowPreview(true);
    },
    onError: () => {
      toast.error("Failed to generate preview");
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      if (template) {
        return apiClient.emailTemplates.update(template.id, data);
      }
      return apiClient.emailTemplates.create({
        workspace_id: workspaceId,
        template_type: selectedType,
        ...data,
      });
    },
    onSuccess: () => {
      toast.success(
        template
          ? "Template updated successfully"
          : "Template created successfully",
      );
      onSave?.();
    },
    onError: () => {
      toast.error("Failed to save template");
    },
  });

  const handlePreview = () => {
    previewMutation.mutate();
  };

  const handleLoadDefault = () => {
    if (defaultTemplate) {
      reset({
        subject: defaultTemplate.subject,
        body: defaultTemplate.body,
      });
      toast.success("Default template loaded");
    }
  };

  const onSubmit = (data: TemplateFormData) => {
    saveMutation.mutate(data);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector(
      'textarea[name="body"]',
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newValue = `${before}{{${variable}}}${after}`;
      textarea.value = newValue;
      textarea.focus();
      textarea.setSelectionRange(
        start + variable.length + 4,
        start + variable.length + 4,
      );
      // Trigger React Hook Form update
      const event = new Event("input", { bubbles: true });
      textarea.dispatchEvent(event);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Template Editor</CardTitle>
          <CardDescription>
            Customize email notifications for your workspace. Use variables like{" "}
            {"{"}
            {"{"}variable{"}"}
            {"}"} for dynamic content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!template && (
            <div className="space-y-2">
              <Label htmlFor="template-type">Template Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template type" />
                </SelectTrigger>
                <SelectContent>
                  {templateTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {type.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {template && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {
                  templateTypes.find((t) => t.value === template.template_type)
                    ?.label
                }
              </Badge>
              {template.is_default && <Badge>Default</Badge>}
              {template.is_active ? (
                <Badge variant="default">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                {...register("subject")}
                placeholder="Email subject"
              />
              {errors.subject && (
                <p className="text-sm text-red-500">{errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                {...register("body")}
                placeholder="Email body (use {{variable}} for dynamic content)"
                rows={12}
                className="font-mono text-sm"
              />
              {errors.body && (
                <p className="text-sm text-red-500">{errors.body.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Template
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={previewMutation.isPending}
              >
                {previewMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </>
                )}
              </Button>

              {!template && defaultTemplate && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLoadDefault}
                  disabled={defaultLoading}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Load Default
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Available Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Available Variables</CardTitle>
          <CardDescription>
            Click to insert a variable at cursor position
          </CardDescription>
        </CardHeader>
        <CardContent>
          {variablesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {variables?.variables?.map((variable) => (
                <Button
                  key={variable.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(variable.name)}
                  className="font-mono"
                >
                  {"{"}
                  {"{"}
                  {variable.name}
                  {"}"}
                  {"}"}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {variable.description}
                  </span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && previewData && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Preview with sample data (actual emails will use real values)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Subject:</Label>
              <div className="rounded-md border bg-muted p-3">
                {previewData.rendered_subject}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Body:</Label>
              <div className="whitespace-pre-wrap rounded-md border bg-muted p-4">
                {previewData.rendered_body}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
