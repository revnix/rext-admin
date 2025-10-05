/**
 * Template Manager Component
 *
 * Handles template selection, saving, and management including
 * template actions like duplicate and delete.
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, RefreshCw, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import type { ExportTemplate } from "@/types/export-customization";

const saveTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  tags: z.string().optional(),
});

type SaveTemplateFormData = z.infer<typeof saveTemplateSchema>;

interface TemplateManagerProps {
  templates: ExportTemplate[];
  selectedTemplate: ExportTemplate | null;
  isSavingTemplate: boolean;
  onApplyTemplate: (template: ExportTemplate) => void;
  onSaveTemplate: (data: SaveTemplateFormData) => Promise<void>;
  onDuplicateTemplate: (template: ExportTemplate) => void;
  onDeleteTemplate: (template: ExportTemplate) => void;
  onResetCustomization: () => void;
}

export function TemplateManager({
  templates,
  selectedTemplate,
  isSavingTemplate,
  onApplyTemplate,
  onSaveTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onResetCustomization,
}: TemplateManagerProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] =
    useState<ExportTemplate | null>(null);

  const saveForm = useForm<SaveTemplateFormData>({
    resolver: zodResolver(saveTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      tags: "",
    },
  });

  const handleSaveTemplate = async (data: SaveTemplateFormData) => {
    await onSaveTemplate(data);
    setSaveDialogOpen(false);
    saveForm.reset();
  };

  const handleDeleteTemplate = async () => {
    if (templateToDelete && !templateToDelete.isSystem) {
      onDeleteTemplate(templateToDelete);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Template Selection */}
      <div className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <Button
            key={template.id}
            variant={
              selectedTemplate?.id === template.id ? "default" : "outline"
            }
            size="sm"
            onClick={() => onApplyTemplate(template)}
            className="text-xs"
          >
            {template.name}
            {template.isSystem && (
              <Badge variant="secondary" className="ml-1 text-xs">
                System
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Template Actions */}
      <div className="flex items-center gap-2">
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-1" />
              Save Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Export Template</DialogTitle>
              <DialogDescription>
                Save your current customization as a reusable template
              </DialogDescription>
            </DialogHeader>

            <Form {...saveForm}>
              <form
                onSubmit={saveForm.handleSubmit(handleSaveTemplate)}
                className="space-y-4"
              >
                <FormField
                  control={saveForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter template name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={saveForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe this template's purpose"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={saveForm.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter tags separated by commas"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Use tags to organize and find templates easily
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSaveDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSavingTemplate}>
                    {isSavingTemplate ? "Saving..." : "Save Template"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Button variant="outline" size="sm" onClick={onResetCustomization}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>

      {/* Selected Template Info */}
      {selectedTemplate && (
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{selectedTemplate.name}</p>
              {selectedTemplate.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {selectedTemplate.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            {!selectedTemplate.isSystem && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDuplicateTemplate(selectedTemplate)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTemplateToDelete(selectedTemplate);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Template Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the template "
              {templateToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
